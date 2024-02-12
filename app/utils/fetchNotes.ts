import type { Semester } from "../types/Notes";

export default async function fetchNotes(
	username: string,
	password: string
): Promise<[true, Semester[]] | [false, null]> {
	const url = new URL("http://129.151.234.121:8081/notes");
	url.searchParams.append("username", username);
	url.searchParams.append("password", password);

	const res = await fetch(url.toString());
	if (!res.ok) return [false, null];

	return [true, await res.json()];
}
