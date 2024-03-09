import { Router } from "express";
import Sector from "../../models/Sector";

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
	if (!(await Sector.exists({ expoPushTokens: expoPushToken }))) return false;

	await Sector.updateOne(
		{ expoPushTokens: expoPushToken },
		{ $pull: { expoPushTokens: expoPushToken } }
	);

	return true;
}

router.post("/", async (req, res) => {
	const { sectorId, expoPushToken } = req.body;

	if (!sectorId || !expoPushToken)
		return res.status(400).json({
			message: "Invlaid request body parameters.",
		});

	await removeExpoPushToken(expoPushToken);

	const sector = await getSector(sectorId);
	sector.expoPushTokens.push(expoPushToken);
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
