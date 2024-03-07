import Sector from "../models/Sector";
import sendNotification from "./sendNotification";
import comparePlannings, { formatChanges } from "./comparePlannings";
import PromosInfo from "../constants/Planning/Info";
import PromosTc from "../constants/Planning/Tc";
import PromosMmi from "../constants/Planning/Mmi";
import fetchPlanning from "./fetchPlanning";
import { Planning, Promo } from "../types/Planning";

const POLLING_INTERVAL = 60_000;
const PREDICT_FORWARD = 14;
const Promos = Object.freeze([PromosInfo, PromosTc, PromosMmi]);
const promoPlannings = new Map<string, Planning>();
let currentPromo = 0;

async function makePlanning(promo: Promo) {
	const planning: Planning = {};

	const results = await Promise.all(
		promo.planningIds.map((planningId) => fetchPlanning(planningId))
	);

	results.forEach((semester) => {
		Object.keys(semester).forEach((date) => {
			if (!planning[date]) planning[date] = [];
			planning[date].push(...semester[date]);
		});
	});

	return { ...promo, planning };
}

export default async function listenForChanges() {
	const promos = await Promise.all(
		Promos[currentPromo].map((promo) => makePlanning(promo))
	);

	promos.forEach(async (promo) => {
		let previousPlanning = promoPlannings.get(promo.notificationChannel);
		if (previousPlanning) previousPlanning = { ...previousPlanning };
		promoPlannings.set(promo.notificationChannel, promo.planning);
		if (!previousPlanning) return;

		const sector = await Sector.findOne({
			sectorId: promo.notificationChannel,
		});

		if (!sector || sector.expoPushTokens.length <= 0) return;

		const changes = comparePlannings(
			previousPlanning,
			promo.planning,
			PREDICT_FORWARD
		);

		if (!changes.length) return;

		formatChanges(changes).forEach((formattedChange) => {
			try {
				sendNotification(
					sector.expoPushTokens.map((token) => token.toString()),
					"Changements dans l'emploi du temps",
					formattedChange
				);
			} catch {
				console.log("Failed to send notifications.");
			}
		});
	});

	currentPromo = (currentPromo + 1) % Promos.length;

	setTimeout(listenForChanges, POLLING_INTERVAL);
}
