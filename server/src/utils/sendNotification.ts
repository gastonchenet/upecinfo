import axios from "axios";

const API_URL = "https://api.expo.dev/v2/push/send";

export default async function sendNotification(
	usersIds: string[],
	title: string,
	body: string
) {
	if (usersIds.length === 0) return;
	await axios.post(API_URL, {
		to: usersIds,
		title,
		body,
	});
}
