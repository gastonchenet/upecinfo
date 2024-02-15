import { Router } from "express";
import puppeteer, { type HTTPRequest, type HTTPResponse } from "puppeteer";
import type { RawSemester, Semester } from "../types/Notes";
import moment from "moment";
import "moment/locale/fr";

const router = Router();

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

	const browser = await puppeteer.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});

	const page = await browser.newPage();

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
						return res.json(parseSemesters(semesters));
					}
				}

				break;
			}
		}
	}

	function filterRequests(req: HTTPRequest) {
		if (["stylesheet", "font", "image"].includes(req.resourceType())) {
			req.abort();
		} else {
			req.continue();
		}
	}

	page.on("request", filterRequests);
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

export default router;
