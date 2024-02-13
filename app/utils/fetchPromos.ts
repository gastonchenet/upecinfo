import { Promo } from "../types/Planning";

export default async function fetchPromos(): Promise<Promo[]> {
	const res = await fetch("http://192.168.1.80:8080/planning/promos");
	if (!res.ok) return [];
	return await res.json();
}
