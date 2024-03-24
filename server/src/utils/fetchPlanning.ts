import {
	EventType,
	type Planning,
	type PlanningEvent,
} from "../types/Planning";
import packageContent from "../../package.json";
import moment from "moment";
import "moment/locale/fr";

export const PLANNING_URL =
	"https://ade.u-pec.fr/jsp/custom/modules/plannings/anonymous_cal.jsp";

const dayMap = new Map<string, Planning>();

function getItemValue(raw: string) {
	return raw.split(":")[1].replace(/\r/g, "");
}

export default async function fetchPlanning(planningId: string) {
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

		const lines = event.split(/\n(?=[A-Z-]+:)/);
		const uid = lines.find((line) => line.startsWith("UID:"));
		const start = lines.find((line) => line.startsWith("DTSTART:"));
		const end = lines.find((line) => line.startsWith("DTEND:"));
		const summary = lines.find((line) => line.startsWith("SUMMARY:"));
		const location = lines.find((line) => line.startsWith("LOCATION:"));
		const description = lines.find((line) => line.startsWith("DESCRIPTION:"));

		if (!uid || !start || !end || !summary || !location || !description) return;

		const parsedStart = moment(
			getItemValue(start),
			"YYYYMMDDTHHmmssZ"
		).utcOffset("+01:00");

		const parsedEnd = moment(getItemValue(end), "YYYYMMDDTHHmmssZ").utcOffset(
			"+01:00"
		);

		const parsedSummary = getItemValue(summary).replace(/\\,\s*/g, ", ");

		const parsedLocation = getItemValue(location)
			.replace(/\s*\(\d+\)/g, "")
			.replace(/\\,\s*/g, "\n")
			.trim();

		const parsedTeacher =
			getItemValue(description)
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.match(
					/(?<=\\n)(?:[A-Z\s][a-z\s]+)(?:(?:-|\n|\s)+[A-Z\s][a-z\s]+)+(?=\\n)/gm
				)?.[0]
				?.replace(/\n\s/g, "") ?? "Professeur inconnu";

		const parsedType =
			/(?<!\w)(?:(?:[eé](?:(?:xam(?:en)?)|valuation))|(?:contr[ôo]le))s?|ds|devoirs\ssurveill[eé]s|devoir\ssurveill[eé](?!\w)/gi.test(
				parsedSummary
			)
				? EventType.Evaluation
				: /(?<!\w)(?:(?:partiel(?:le)?|soutenance)s?)|(?:sa[eé])(?!\w)/gi.test(
						parsedSummary
				  )
				? EventType.Sae
				: EventType.Class;

		data.push({
			uid: getItemValue(uid),
			start: parsedStart.toISOString(),
			end: parsedEnd.toISOString(),
			summary: parsedSummary,
			location: parsedLocation,
			teacher: parsedTeacher,
			type: parsedType,
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
