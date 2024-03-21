import Links from "../constants/Links";
import type { Message } from "../types/Message";

export async function fetchMessages(): Promise<Message[]> {
	const res = await fetch(`${Links.API_URL}/info`);
	if (!res.ok) return [];
	return await res.json();
}
