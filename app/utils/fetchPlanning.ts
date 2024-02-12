import type { Planning } from "../types/Planning";

export default async function fetchPlanning(): Promise<Planning> {
	const res = await fetch("http://129.151.234.121:8081/planning");
	if (!res.ok) return {};
	return await res.json();
}
