import type { Message } from "../types/Message";

export default async function fetchMessages(): Promise<Message[]> {
	const res = await fetch("https://upec-info.com/information");
	if (!res.ok) return [];
	return await res.json();
}
