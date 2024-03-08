import axios from "axios";
import type { Planning } from "../types";
import type { Promo } from "../roles";

export default async function fetchPlanning(
	promo: Promo
): Promise<{ planning: Planning; url: string } | null> {
	const url = new URL("https://upec-info.com/planning");
	url.searchParams.append("year", promo.year.toString());
	url.searchParams.append("campus", promo.campus);
	url.searchParams.append("group", promo.group.toString());

	try {
		const { data } = await axios.get(url.toString());

		return {
			planning: data,
			url: "https://ade.u-pec.fr/direct/?login=etuiutsen",
		};
	} catch (error) {
		console.error(error);
		return null;
	}
}
