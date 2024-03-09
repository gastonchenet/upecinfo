import type { Message } from "../types/Message";

export default async function fetchMessages(): Promise<Message[]> {
	const res = await fetch("http://192.168.1.80:8080/v1/information");
	if (!res.ok) return [];
	return await res.json();
}
