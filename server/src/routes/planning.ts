import { Router } from "express";
import type { Planning, PlanningEvent } from "../types/Planning";
import moment from "moment";
import "moment/locale/fr";
import packageContent from "../../package.json";
import {
	PLANNING_URL,
	PLANNING_SEM1_ID,
	PLANNING_SEM2_ID,
} from "../constants/Planning";

moment.locale("fr");

const router = Router();
let days: Planning = {};

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
			"User-Agent": `UpecPlanning/${packageContent.version} (com.ducassoulet.planning)`,
		},
	});

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

	return days;
}

router.get("/", async (req, res) => {
	const data = await Promise.all([
		fetchPlanning(PLANNING_SEM1_ID),
		fetchPlanning(PLANNING_SEM2_ID),
	]);

	return res.json({ ...data[0], ...data[1] });
});

export default router;
