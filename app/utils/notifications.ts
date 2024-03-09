export async function setExpoPushToken(
	sectorId: string,
	expoPushToken: string
) {
	const res = await fetch("http://192.168.1.80:8080/v1/notifications", {
		method: "POST",
		body: JSON.stringify({ sectorId, expoPushToken }),
		headers: {
			"Content-Type": "application/json",
		},
	});

	return res.ok;
}

export async function deleteExpoPushToken(expoPushToken: string) {
	const res = await fetch("http://192.168.1.80:8080/v1/notifications", {
		method: "DELETE",
		body: JSON.stringify({ expoPushToken }),
		headers: {
			"Content-Type": "application/json",
		},
	});

	return res.ok;
}
