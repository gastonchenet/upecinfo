import { Promo } from "../types/Planning";

export default async function fetchPromos(): Promise<Promo[]> {
	const res = await fetch("https://upec-info.com/planning/promos");
	if (!res.ok) return [];
	return await res.json();
}
