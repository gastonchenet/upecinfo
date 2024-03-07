import { Router } from "express";
import {
	Sector as SectorType,
	type Campus,
	type Planning,
	type PlanningEvent,
} from "../types/Planning";
import moment from "moment";
import "moment/locale/fr";
import PromosInfo from "../constants/Planning/Info";
import PromosTc from "../constants/Planning/Tc";
import PromosMmi from "../constants/Planning/Mmi";
import Sector from "../models/Sector";
import fetchPlanning from "../utils/fetchPlanning";

const Promos = Object.freeze({
	[SectorType.Info]: PromosInfo,
	[SectorType.Tc]: PromosTc,
	[SectorType.Mmi]: PromosMmi,
});

moment.locale("fr");

const router = Router();

async function getSector(sectorId: string) {
	const sector = await Sector.findOne({ sectorId });

	if (!sector) {
		const newSector = new Sector({
			sectorId,
			expoPushTokens: [],
		});

		await newSector.save();

		return newSector;
	}

	return sector;
}

function getPromo(
	sector: SectorType,
	year: number,
	campus: Campus,
	group: number
) {
	return (
		Promos[sector].find(
			(promo) =>
				promo.year === year && promo.campus === campus && promo.group === group
		) ?? null
	);
}

router.post("/", async (req, res) => {
	const planning: Planning = {};
	const { sector, year, campus, group } = req.query;
	const expoPushToken = req.body.expoPushToken;

	if (!sector || !year || !campus || !group)
		return res.status(400).json({
			message: "Invlaid request query parameters.",
		});

	const promo = getPromo(
		sector?.toString() as SectorType,
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

	if (expoPushToken) {
		if (await Sector.exists({ expoPushTokens: expoPushToken })) {
			await Sector.updateOne(
				{ expoPushTokens: expoPushToken },
				{ $pull: { expoPushTokens: expoPushToken } }
			);
		}

		const sector = await getSector(promo.notificationChannel);
		sector.expoPushTokens.push(expoPushToken);
		await sector.save();
	}

	return res.json(planning);
});

router.get("/promos", (req, res) => {
	return res.json(Promos);
});

export default router;
