import type { Promos } from "../types/Planning";

export default async function fetchPromos(): Promise<Promos> {
	const res = await fetch("http://192.168.1.80:8080/v1/planning/promos");
	if (!res.ok) return {};
	return await res.json();
}
