import { Router } from "express";
import { Sector, type Campus, type Planning } from "../../types/Planning";
import moment from "moment";
import "moment/locale/fr";
import PromosInfo from "../../constants/Planning/Info";
import PromosTc from "../../constants/Planning/Tc";
import PromosMmi from "../../constants/Planning/Mmi";
import fetchPlanning from "../../utils/fetchPlanning";

const Promos = Object.freeze({
	[Sector.Info]: PromosInfo,
	[Sector.Tc]: PromosTc,
	[Sector.Mmi]: PromosMmi,
});

moment.locale("fr");

const router = Router();

function getPromo(sector: Sector, year: number, campus: Campus, group: number) {
	return (
		Promos[sector].find(
			(promo) =>
				promo.year === year && promo.campus === campus && promo.group === group
		) ?? null
	);
}

router.get("/", async (req, res) => {
	const planning: Planning = {};
	const { sector, year, campus, group } = req.query;

	if (!sector || !year || !campus || !group)
		return res.status(400).json({
			message: "Invlaid request query parameters.",
		});

	const promo = getPromo(
		sector?.toString() as Sector,
		parseInt(year?.toString()!),
		campus?.toString() as Campus,
		parseInt(group?.toString()!)
	);

	if (!promo)
		return res.status(404).json({
			message: "This promo doesn't exist.",
		});

	const data = await Promise.all(
		promo.planningIds.map((planningId) => fetchPlanning(planningId))
	);

	data.forEach((semester) => {
		Object.keys(semester).forEach((date) => {
			if (!planning[date]) planning[date] = [];
			planning[date].push(...semester[date]);
		});
	});

	return res.json(planning);
});

router.get("/promos", (req, res) => {
	return res.json(Promos);
});

export default router;
