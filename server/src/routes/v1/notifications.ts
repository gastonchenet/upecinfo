import { Router } from "express";
import Sector from "../../models/Sector";
import Notification from "../../models/Notification";

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

async function removeExpoPushToken(expoPushToken: string) {
	if (!(await Sector.exists({ planningExpoPushTokens: expoPushToken })))
		return false;

	await Sector.updateOne(
		{ planningExpoPushTokens: expoPushToken },
		{ $pull: { planningExpoPushTokens: expoPushToken } }
	);

	return true;
}

router.get("/", async (req, res) => {
	const { expoPushToken, page, limit } = req.query;

	if (!expoPushToken || !page || !limit)
		return res.status(400).json({
			message: "Invlaid query parameters.",
		});

	const notifications = await Notification.find({
		expoPushTokens: expoPushToken.toString(),
	})
		.sort({ createdAt: -1 })
		.skip(parseInt(page.toString()) * parseInt(limit.toString()))
		.limit(parseInt(limit.toString()));

	return res.status(200).json(
		notifications.map((n) => {
			const notif = n.toObject();

			return {
				title: notif.title,
				body: notif.body,
				icon: notif.icon,
				action: notif.action,
				createdAt: notif.createdAt,
			};
		})
	);
});

router.post("/", async (req, res) => {
	const { sectorId, expoPushToken } = req.body;

	if (!sectorId || !expoPushToken)
		return res.status(400).json({
			message: "Invlaid request body parameters.",
		});

	await removeExpoPushToken(expoPushToken);

	const sector = await getSector(sectorId);
	sector.planningExpoPushTokens.push(expoPushToken);
	await sector.save();

	return res.sendStatus(200);
});

router.delete("/", async (req, res) => {
	const { expoPushToken } = req.body;

	if (!expoPushToken)
		return res.status(400).json({
			message: "Invlaid request body parameters.",
		});

	await removeExpoPushToken(expoPushToken);

	return res.sendStatus(200);
});

export default router;
