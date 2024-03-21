import Links from "../constants/Links";

export async function fetchNotifications(
	expoPushToken: string,
	page: number = 0,
	limit: number = 50
) {
	const url = new URL(`${Links.API_URL}/notif`);
	url.searchParams.append("expoPushToken", expoPushToken);
	url.searchParams.append("page", page.toString());
	url.searchParams.append("limit", limit.toString());

	const res = await fetch(url.toString());
	if (!res.ok) return [];

	return res.json();
}

export async function setExpoPushTokenPlanning(
	sectorId: string,
	expoPushToken: string
) {
	const res = await fetch(`${Links.API_URL}/notif/planning`, {
		method: "POST",
		body: JSON.stringify({ sectorId, expoPushToken }),
		headers: { "Content-Type": "application/json" },
	});

	return res.ok;
}

export async function deleteExpoPushTokenPlanning(expoPushToken: string) {
	const res = await fetch(`${Links.API_URL}/notif/planning`, {
		method: "DELETE",
		body: JSON.stringify({ expoPushToken }),
		headers: { "Content-Type": "application/json" },
	});

	return res.ok;
}

export async function setExpoPushTokenInfo(
	sectorId: string,
	expoPushToken: string
) {
	const res = await fetch(`${Links.API_URL}/notif/info`, {
		method: "POST",
		body: JSON.stringify({ sectorId, expoPushToken }),
		headers: { "Content-Type": "application/json" },
	});

	return res.ok;
}

export async function deleteExpoPushTokenInfo(expoPushToken: string) {
	const res = await fetch(`${Links.API_URL}/notif/info`, {
		method: "DELETE",
		body: JSON.stringify({ expoPushToken }),
		headers: { "Content-Type": "application/json" },
	});

	return res.ok;
}
