import { Router } from "express";
import puppeteer, { type HTTPRequest, type HTTPResponse } from "puppeteer";
import type { RawSemester, Semester } from "../types/Notes";
import moment from "moment";
import "moment/locale/fr";
import { createHash } from "crypto";
import { UPDATE_INTERVAL } from "../constants/Notes";
import {
	ARGS,
	EXECUTABLEPATH,
	HEADLESS,
	USERAGENT,
} from "../constants/Puppeteer";
import Distribution from "../models/Distribution";

const router = Router();

const users = new Set<string>();
const userSemesters = new Map<string, Semester[]>();

let lastUpdate = moment().subtract(UPDATE_INTERVAL);

function hashUser(username: string, password: string) {
	return createHash("sha256")
		.update(username + password)
		.digest("hex");
}

function parseSemesters(rawSemesters: RawSemester[]) {
	const semesters: Semester[] = [];

	rawSemesters.forEach((rawSemester) => {
		const semester: Semester = {
			num: rawSemester.num,
			startDate: moment(rawSemester.startDate, "YYYY-MM-DD").toISOString(),
			endDate: moment(rawSemester.endDate, "YYYY-MM-DD").toISOString(),
			rank: rawSemester.rank,
			groupSize: rawSemester.groupSize,
			note: parseFloat(rawSemester.note),
			min_note: parseFloat(rawSemester.min_note),
			max_note: parseFloat(rawSemester.max_note),
			average: parseFloat(rawSemester.average),
			resources: [],
			saes: [],
		};

		["resources", "saes"].forEach((type) => {
			const parsedResources = Object.entries(
				rawSemester[type as "resources" | "saes"]
			).map(([id, resource]) => ({
				id,
				title: resource.titre,
				evaluations: resource.evaluations.map((rawEvaluation) => ({
					id: rawEvaluation.id,
					title: rawEvaluation.description,
					coefficient: parseFloat(rawEvaluation.coef),
					note: parseFloat(rawEvaluation.note.value),
					min_note: parseFloat(rawEvaluation.note.min),
					max_note: parseFloat(rawEvaluation.note.max),
					average: parseFloat(rawEvaluation.note.moy),
					date: rawEvaluation.date,
					weight: Object.entries(rawEvaluation.poids)
						.filter(([_, value]) => value !== 0)
						.map(([key]) => key),
				})),
			}));

			semester[type as "resources" | "saes"] = parsedResources;
		});

		semesters.push(semester);
	});

	return semesters.sort((a, b) => a.num - b.num);
}

router.get("/", async (req, res) => {
	const { password, username } = req.query;
	const semesters: RawSemester[] = [];
	let maxSemesters = 0;

	if (!username || !password) {
		return res.status(400).json({ message: "Missing username or password" });
	}

	if (moment().diff(lastUpdate) < UPDATE_INTERVAL) {
		const userHash = hashUser(username.toString(), password.toString());
		const user = userSemesters.get(userHash);

		if (user) return res.json(user);
	}

	const browser = await puppeteer.launch({
		headless: HEADLESS,
		args: ARGS,
		executablePath: EXECUTABLEPATH,
	});

	const page = await browser.newPage();
	await page.setUserAgent(USERAGENT);
	await page.setRequestInterception(true);

	function filterRequests(req: HTTPRequest) {
		if (["stylesheet", "font", "image"].includes(req.resourceType())) {
			req.abort();
		} else {
			req.continue();
		}
	}

	page.on("request", filterRequests);

	await page.goto("https://www.iut-fbleau.fr/notes/", {
		waitUntil: "networkidle2",
	});

	async function handleSemesters(response: HTTPResponse) {
		const url = new URL(response.url());
		const urlPath = url.hostname + url.pathname;
		const query = url.searchParams.get("q");

		switch (urlPath) {
			case "www.iut-fbleau.fr/ainur/login": {
				if (response.status() !== 302) {
					page.off("request", filterRequests);
					page.off("response", handleSemesters);
					await browser.close();
				}

				break;
			}

			case "www.iut-fbleau.fr/notes/services/data.php": {
				if (query === "relevéEtudiant") {
					const data = await response.json();

					semesters.push({
						num: data["relevé"].semestre.numero,
						startDate: data["relevé"].semestre.date_debut,
						endDate: data["relevé"].semestre.date_fin,
						rank: data["relevé"].semestre.rang.value,
						groupSize: data["relevé"].semestre.rang.total,
						note: data["relevé"].semestre.notes.value,
						min_note: data["relevé"].semestre.notes.min,
						max_note: data["relevé"].semestre.notes.max,
						average: data["relevé"].semestre.notes.moy,
						resources: data["relevé"].ressources,
						saes: data["relevé"].saes,
					});

					if (semesters.length >= maxSemesters) {
						page.off("request", filterRequests);
						page.off("response", handleSemesters);
						await browser.close();
						const parsedSemesters = parseSemesters(semesters);

						const userHash = hashUser(
							username!.toString(),
							password!.toString()
						);

						if (!users.has(userHash)) users.add(userHash);
						userSemesters.set(userHash, parsedSemesters);
						lastUpdate = moment();

						return res.json(parsedSemesters);
					}
				}

				break;
			}
		}
	}

	page.on("response", handleSemesters);

	await page.waitForSelector("#username");
	await page.type("#username", username.toString());
	await page.type("#password", password.toString());

	await page.click("button[type='submit']");

	try {
		await page.waitForSelector(".semestres", { visible: true });

		maxSemesters = await page.evaluate(() => {
			const semestres = document.querySelectorAll(".semestres label");
			return semestres.length;
		});

		for (let i = maxSemesters; i > 0; i--) {
			await page.click(`.semestres label:nth-child(${i})`);
		}
	} catch {
		return res.status(401).json({ message: "Invalid credentials" });
	}
});

router.get("/:noteId/distribution", async (req, res) => {
	const { password, username } = req.query;

	if (!username || !password) {
		return res.status(400).json({ message: "Missing username or password" });
	}

	const evalId = parseInt(req.params.noteId);

	const userHash = hashUser(username.toString(), password.toString());

	if (users.has(userHash)) {
		const noteManager = await Distribution.findOne({ evalId });
		if (noteManager) return res.json(noteManager.distrib);
	}

	const browser = await puppeteer.launch({
		headless: HEADLESS,
		args: ARGS,
		executablePath: EXECUTABLEPATH,
	});

	const page = await browser.newPage();
	await page.setUserAgent(USERAGENT);
	await page.setRequestInterception(true);

	function filterRequests(req: HTTPRequest) {
		if (["stylesheet", "font", "image"].includes(req.resourceType())) {
			req.abort();
		} else {
			req.continue();
		}
	}

	page.on("request", filterRequests);

	await page.goto("https://www.iut-fbleau.fr/notes/", {
		waitUntil: "networkidle2",
	});

	async function handleSemesters(response: HTTPResponse) {
		const url = new URL(response.url());
		const urlPath = url.hostname + url.pathname;

		if (urlPath === "www.iut-fbleau.fr/ainur/login") {
			if (response.status() !== 302) {
				page.off("request", filterRequests);
				page.off("response", handleSemesters);
				await browser.close();
			}
		}
	}

	page.on("response", handleSemesters);

	await page.waitForSelector("#username");
	await page.type("#username", username.toString());
	await page.type("#password", password.toString());

	await page.click("button[type='submit']");

	try {
		await page.waitForSelector(".semestres", { visible: true });
		await page.goto(
			`https://www.iut-fbleau.fr/notes/services/data.php?q=listeNotes&eval=${req.params.noteId}`,
			{
				waitUntil: "networkidle2",
			}
		);

		const content: number[] | null = await page.evaluate(() => {
			try {
				return JSON.parse(document.querySelector("pre")!.innerText);
			} catch {
				return null;
			}
		});

		await browser.close();

		if (!content) return res.status(404).json({ message: "Note not found" });

		const noteDistrib = new Array(21).fill(0);

		content.forEach((note) => {
			noteDistrib[Math.floor(note)]++;
		});

		if (!users.has(userHash)) users.add(userHash);

		if (!(await Distribution.exists({ evalId }))) {
			const noteManager = new Distribution({
				evalId,
				distrib: noteDistrib,
			});

			await noteManager.save();
		}

		return res.json(noteDistrib);
	} catch {
		return res.status(401).json({ message: "Invalid credentials" });
	}
});

export default router;
