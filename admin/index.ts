import mongoose from "mongoose";
import Sector from "./models/Sector";
import Notification from "./models/Notification";
import moment from "moment";
import readline from "readline";

type SectorType = {
	planningExpoPushTokens: string[];
	infoExpoPushTokens: string[];
	sectorId: string;
};

const API_URL = "https://api.expo.dev/v2/push/send";

const table = process.argv.includes("-d") ? "test" : "production";

async function connectMongo() {
	console.log(`[${moment().format("HH:mm:ss")}] Connecting to MongoDB...`);

	await mongoose.connect(
		`mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}.mongodb.net/${table}?retryWrites=true&w=majority&appName=upecinfo`
	);
}

function input(text: string): Promise<string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		rl.question(text, (line) => {
			rl.close();
			resolve(line);
		});
	});
}

async function sendNotification(
	usersIds: string[],
	title: string,
	body: string
) {
	return await fetch(API_URL, {
		method: "POST",
		body: JSON.stringify({ to: usersIds, title, body }),
		headers: {
			"Content-Type": "application/json",
		},
	});
}

function getExpoPushTokens(sector: SectorType) {
	return [
		...new Set([
			...sector.planningExpoPushTokens.map((token) => token.toString()),
			...sector.infoExpoPushTokens.map((token) => token.toString()),
		]),
	];
}

async function sendNotifications() {
	await connectMongo();

	const sectors = await Sector.find();
	const filteredSectors = sectors.filter(
		(sector) => getExpoPushTokens((<unknown>sector) as SectorType).length > 0
	);

	console.log(
		`[${moment().format("HH:mm:ss")}] Found ${filteredSectors.length} sectors :`
	);

	const maxSectorLength = Math.max(
		...filteredSectors.map((sector) => sector.sectorId.length)
	);

	for (const sector of filteredSectors) {
		console.log(
			`- ${sector.sectorId.padEnd(maxSectorLength)} (${
				getExpoPushTokens((<unknown>sector) as SectorType).length
			} tokens)`
		);
	}

	const rawSectors = await input(
		`[${moment().format(
			"HH:mm:ss"
		)}] Which sectors do you want to send the notification to ? (<SECTOR_ID>/all) : `
	);

	let selectedSectors: { expoPushTokens: string[]; sectorId: string }[] = [];

	if (rawSectors === "all") {
		selectedSectors = filteredSectors.map((sector) => ({
			expoPushTokens: getExpoPushTokens((<unknown>sector) as SectorType),
			sectorId: sector.sectorId,
		}));
	}

	if (rawSectors !== "all") {
		selectedSectors = filteredSectors
			.filter((sector) => rawSectors.split(" ").includes(sector.sectorId))
			.map((sector) => ({
				expoPushTokens: getExpoPushTokens((<unknown>sector) as SectorType),
				sectorId: sector.sectorId,
			}));
	}

	console.log(
		`[${moment().format("HH:mm:ss")}] Selected ${
			selectedSectors.length
		} sectors`
	);

	const title = await input(
		`[${moment().format("HH:mm:ss")}] Notification title : `
	);

	const body = await input(
		`[${moment().format("HH:mm:ss")}] Notification body : `
	);

	console.log(
		`[${moment().format(
			"HH:mm:ss"
		)}] Sending notification to selected sectors...`
	);

	const expoPushTokens = selectedSectors.flatMap(
		(sector) => sector.expoPushTokens
	);

	await sendNotification(expoPushTokens, title, body);
	await Notification.create({ title, body, expoPushTokens });

	console.log(
		`[${moment().format("HH:mm:ss")}] Notification sent to ${
			expoPushTokens.length
		} devices`
	);
}

async function deviceLookup() {
	await connectMongo();

	const sectors = await Sector.find();

	console.log(
		`[${moment().format("HH:mm:ss")}] Found ${sectors.reduce(
			(acc, val) =>
				acc + getExpoPushTokens((<unknown>val) as SectorType).length,
			0
		)} devices.`
	);
}

console.log(
	`[${moment().format("HH:mm:ss")}] Welcome to the admin CLI !${
		process.argv.includes("-d") ? " (test mode)" : ""
	}\n[${moment().format("HH:mm:ss")}] What do you want to do ?`
);

const actions = [
	{
		id: "devices-lookup",
		label: "Lookup for devices",
		function: deviceLookup,
	},
	{
		id: "send-notifications",
		label: "Send notifications",
		function: sendNotifications,
	},
	{
		id: "exit",
		label: "Exit",
		function: () => process.exit(0),
	},
];

for (let i = 0; i < actions.length; i++) {
	const action = actions[i];
	console.log(`- (${i + 1}) ${action.label}`);
}

const action = await input(
	`[${moment().format("HH:mm:ss")}] What do you want to do ? `
);

const selectedAction = actions[parseInt(action) - 1];

if (!selectedAction) {
	console.log(`[${moment().format("HH:mm:ss")}] Invalid action.`);
	process.exit(1);
}

console.log(
	`[${moment().format("HH:mm:ss")}] You selected : ${selectedAction.label}`
);

await selectedAction.function();

process.exit(0);
