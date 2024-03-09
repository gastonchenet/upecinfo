import type { Campus, Planning, Sector } from "../types/Planning";

export default async function fetchPlanning(
	sector: Sector,
	year: number,
	campus: Campus,
	group: number,
	expoPushToken: string | null
): Promise<[true, Planning] | [false, null]> {
	const url = new URL("http://192.168.1.80:8080/v1/planning");
	url.searchParams.append("sector", sector);
	url.searchParams.append("year", year.toString());
	url.searchParams.append("campus", campus);
	url.searchParams.append("group", group.toString());

	const res = await fetch(url.toString(), {
		method: "POST",
		body: JSON.stringify({ expoPushToken }),
		headers: {
			"Content-Type": "application/json",
		},
	});

	if (!res.ok) return [false, null];

	return [true, await res.json()];
}
