import { Router } from "express";
import type { Campus, Planning, PlanningEvent } from "../types/Planning";
import moment from "moment";
import "moment/locale/fr";
import packageContent from "../../package.json";
import {
	PLANNING_URL,
	BUT_1_SEN,
	BUT_1_FBL_1,
	BUT_1_FBL_2,
	BUT_1_FBL_3,
	BUT_1_FBL_4,
	BUT_1_FBL_5,
	BUT_1_FBL_6,
	BUT_2_FBL_FI_1,
	BUT_2_FBL_FI_2,
	BUT_2_FBL_FI_3,
	BUT_2_FBL_FI_4,
	BUT_2_FBL_FA,
	BUT_3,
} from "../constants/Planning";

const Promos = Object.freeze([
	BUT_1_SEN,
	BUT_1_FBL_1,
	BUT_1_FBL_2,
	BUT_1_FBL_3,
	BUT_1_FBL_4,
	BUT_1_FBL_5,
	BUT_1_FBL_6,
	BUT_2_FBL_FI_1,
	BUT_2_FBL_FI_2,
	BUT_2_FBL_FI_3,
	BUT_2_FBL_FI_4,
	BUT_2_FBL_FA,
	BUT_3,
]);

moment.locale("fr");

const router = Router();
const dayMap: Map<string, Planning> = new Map();

function getItemValue(raw: string) {
	return raw.split(":")[1];
}

async function fetchPlanning(planningId: string) {
	const url = new URL(PLANNING_URL);
	url.searchParams.set("data", planningId);

	const res = await fetch(url.toString(), {
		method: "GET",
		headers: {
			Accept: "*/*",
			"User-Agent": `UpecInfo/${packageContent.version} (com.ducassoulet.upecinfo)`,
		},
	});

	let days = dayMap.get(planningId) ?? {};
	if (!res.ok) return days;
	const rawData = await res.text();
	const data: PlanningEvent[] = [];

	days = {};

	rawData.split("BEGIN:VEVENT").forEach((event) => {
		if (!event.includes("END:VEVENT")) return;

		const lines = event.split("\n");
		const start = lines.find((line) => line.startsWith("DTSTART:"));
		const end = lines.find((line) => line.startsWith("DTEND:"));
		const summary = lines.find((line) => line.startsWith("SUMMARY:"));
		const location = lines.find((line) => line.startsWith("LOCATION:"));
		const description = lines.find((line) => line.startsWith("DESCRIPTION:"));

		if (!start || !end || !summary || !location || !description) return;

		const parsedStart = moment(
			getItemValue(start),
			"YYYYMMDDTHHmmssZ"
		).utcOffset("+01:00");

		const parsedEnd = moment(getItemValue(end), "YYYYMMDDTHHmmssZ").utcOffset(
			"+01:00"
		);

		const parsedLocation = getItemValue(location)
			.replace(/\s*\(\d+\)/g, "")
			.trim();

		const parsedTeacher = getItemValue(description)
			.split(/(?:\\n)+/)
			.at(-2);

		if (!parsedTeacher) return;

		data.push({
			start: parsedStart.toISOString(),
			end: parsedEnd.toISOString(),
			summary: getItemValue(summary),
			location: parsedLocation,
			teacher: parsedTeacher,
		});
	});

	data
		.sort((a, b) => moment(a.start).valueOf() - moment(b.start).valueOf())
		.forEach((event) => {
			const date = moment(event.start).format("YYYY-MM-DD");
			if (!days[date]) days[date] = [];
			days[date].push(event);
		});

	dayMap.set(planningId, days);

	return days;
}

function getPromo(year: number, campus: Campus, group: number) {
	return (
		Promos.find(
			(promo) =>
				promo.year === year && promo.campus === campus && promo.group === group
		) ?? null
	);
}

router.get("/", async (req, res) => {
	const planning: Planning = {};
	const { year, campus, group } = req.query;

	if (!year || !campus || !group)
		return res.status(400).json({
			message: "Invlaid request query parameters.",
		});

	const promo = getPromo(
		parseInt(year?.toString()!),
		campus?.toString() as Campus,
		parseInt(group?.toString()!)
	);

	if (!promo)
		return res.status(404).json({
			message: "This promo doesn't exist.",
		});

	const data = await Promise.all(
		promo.planningIds.map((planningId) => fetchPlanning(planningId))
	);

	data.forEach((semester) => {
		Object.keys(semester).forEach((date) => {
			if (!planning[date]) planning[date] = [];
			planning[date].push(...semester[date]);
		});
	});

	return res.json(planning);
});

router.get("/promos", (req, res) => {
	return res.json(Promos);
});

export default router;
