import type { Planning } from "../types/Planning";

export default async function fetchPlanning(): Promise<Planning> {
	const res = await fetch("http://192.168.1.80:8080/planning");
	if (!res.ok) return {};
	return await res.json();
}
