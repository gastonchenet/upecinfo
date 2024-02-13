import type { Campus, Planning } from "../types/Planning";

export default async function fetchPlanning(
	year: number,
	campus: Campus,
	group: number
): Promise<[true, Planning] | [false, null]> {
	const url = new URL("http://192.168.1.80:8080/planning");
	url.searchParams.append("year", year.toString());
	url.searchParams.append("campus", campus);
	url.searchParams.append("group", group.toString());

	const res = await fetch(url.toString());
	if (!res.ok) return [false, null];

	return [true, await res.json()];
}
