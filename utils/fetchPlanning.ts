import moment from "moment";
import type { Planning, PlanningEvent } from "../types/Planning";

const PLANNING_URL =
	"https://ade.u-pec.fr/jsp/custom/modules/plannings/anonymous_cal.jsp";

function getItemValue(raw: string) {
	return raw.split(":")[1];
}

export default async function fetchPlanning(planningId: string) {
	const days: Planning = {};

	const url = new URL(PLANNING_URL);
	url.searchParams.set("data", planningId);

	const res = await fetch(url.toString(), {
		method: "GET",
		headers: {
			Accept: "*/*",
			"User-Agent": "UpecPlanning/1.0 (com.ducassoulet.planning)",
		},
	});

	if (!res.ok) return {};
	const rawData = await res.text();
	const data: PlanningEvent[] = [];

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
