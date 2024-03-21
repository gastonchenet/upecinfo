import Sector from "../models/Sector";
import Notification from "../models/Notification";
import sendNotification from "../utils/sendNotification";
import comparePlannings, {
	ModificationType,
	formatChanges,
} from "../utils/comparePlannings";
import PromosInfo from "../constants/Planning/Info";
import PromosTc from "../constants/Planning/Tc";
import PromosMmi from "../constants/Planning/Mmi";
import fetchPlanning from "../utils/fetchPlanning";
import { Planning, Promo } from "../types/Planning";
import moment from "moment";

const NOTIFICATION_TITLE = "Changements dans l'emploi du temps";
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

export default async function planningListener() {
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

		if (!sector || sector.planningExpoPushTokens.length <= 0) return;

		const changes = comparePlannings(
			previousPlanning,
			promo.planning,
			PREDICT_FORWARD
		);

		if (!changes.length) return;

		formatChanges(changes).forEach(async (change) => {
			try {
				const expoPushTokens = sector.planningExpoPushTokens.map((token) =>
					token.toString()
				);

				await Notification.create({
					title: NOTIFICATION_TITLE,
					body: change.formated,
					icon:
						change.type === ModificationType.Added
							? "add-circle-outline"
							: ModificationType.Deleted
							? "remove-circle-outline"
							: "create-outline",
					action:
						"TODATE:" +
						moment(change.to?.start ?? change.from?.start).format("YYYY-MM-DD"),
					expoPushTokens,
				});

				await sendNotification(
					expoPushTokens,
					NOTIFICATION_TITLE,
					change.formated
				);
			} catch {
				console.log("Failed to send notifications.");
			}
		});
	});

	currentPromo = (currentPromo + 1) % Promos.length;

	setTimeout(planningListener, POLLING_INTERVAL);
}
