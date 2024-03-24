import Links from "../constants/Links";
import type { Message } from "../types/Message";
import type { Promo, Sector } from "../types/Planning";

export async function fetchMessages(
	promo: Promo & { sector: Sector }
): Promise<Message[]> {
	const url = new URL(`${Links.API_URL}/info`);
	url.searchParams.set("sector", promo.sector);
	url.searchParams.set("promo", promo.notificationChannel);
	const res = await fetch(url.toString());
	if (!res.ok) return [];
	return await res.json();
}
