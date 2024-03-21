import Links from "../constants/Links";
import type { Distribution, Semester } from "../types/Notes";

export async function fetchNotes(
	username: string,
	password: string
): Promise<[true, Semester[]] | [false, null]> {
	const url = new URL(`${Links.API_URL}/notes`);
	url.searchParams.append("username", username);
	url.searchParams.append("password", password);

	const res = await fetch(url.toString());
	if (!res.ok) return [false, null];

	return [true, await res.json()];
}

export async function fetchNoteDistribution(
	evalId: number,
	username: string,
	password: string
): Promise<[true, Distribution] | [false, null]> {
	const url = new URL(`${Links.API_URL}/notes/${evalId}/distribution`);
	url.searchParams.append("username", username);
	url.searchParams.append("password", password);

	const res = await fetch(url.toString());
	if (!res.ok) return [false, null];

	return [true, await res.json()];
}
