import Links from "../constants/Links";
import type { Campus, Planning, Sector, Promos } from "../types/Planning";

export async function fetchPlanning(
	sector: Sector,
	year: number,
	campus: Campus,
	group: number
): Promise<[true, Planning] | [false, null]> {
	const url = new URL(`${Links.API_URL}/planning`);
	url.searchParams.append("sector", sector);
	url.searchParams.append("year", year.toString());
	url.searchParams.append("campus", campus);
	url.searchParams.append("group", group.toString());

	const res = await fetch(url.toString());
	if (!res.ok) return [false, null];

	return [true, await res.json()];
}

export async function fetchPromos(): Promise<Promos> {
	const res = await fetch(`${Links.API_URL}/planning/promos`);
	if (!res.ok) return {};
	return await res.json();
}
