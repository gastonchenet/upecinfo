import Discord, { ColorResolvable } from "discord.js";
import Event from "../classes/Event";
import fetchPlanning from "../utils/fetchPlanning";
import roles from "../roles";
import { Campus, ChangeType, Class, PlanningChange } from "../types";
import User from "../models/User";
import moment from "moment";
import sendMail from "../utils/sendMail";

const rolePlannings: { [key: string]: Class[] } = {};

function detectPlanningChanges(
	oldPlan: Class[],
	newPlan: Class[]
): PlanningChange[] {
	const changes: PlanningChange[] = [];

	for (const oldItem of oldPlan) {
		if (!newPlan.some((newItem) => isEqual(oldItem, newItem))) {
			changes.push({ type: ChangeType.Removed, item: oldItem });
		}
	}

	for (const newItem of newPlan) {
		if (!oldPlan.some((oldItem) => isEqual(newItem, oldItem))) {
			changes.push({ type: ChangeType.Added, item: newItem });
		}
	}

	return changes.filter((change) => {
		const date = moment(change.item.date);
		const now = moment();

		return date.isBetween(now, now.add(2, "weeks"));
	});
}

function isEqual(item1: Class, item2: Class): boolean {
	return (
		`${item1.day}:${item1.time.startHours}:${item1.time.startMin}` ===
			`${item2.day}:${item2.time.startHours}:${item2.time.startMin}` &&
		`${item1.day}:${item1.time.endHours}:${item1.time.endMin}` ===
			`${item2.day}:${item2.time.endHours}:${item2.time.endMin}` &&
		item1.title === item2.title &&
		item1.room === item2.room
	);
}

export default new Event(Discord.Events.ClientReady, async (client) => {
	console.log(`Logged as ${client.user?.displayName}`);

	await client.application?.commands?.set(
		client.commands.map(
			(command) => <Discord.ApplicationCommandDataResolvable>command.data
		)
	);

	// function polling(): any {
	// 	Object.entries(roles).forEach(async ([roleId, role]) => {
	// 		const planningData = await fetchPlanning(role);

	// 		if (!planningData) return;

	// 		const { planning } = planningData;

	// 		if (Object.keys(rolePlannings).length < Object.keys(roles).length) {
	// 			return (rolePlannings[roleId] = planning);
	// 		}

	// 		const changes = detectPlanningChanges(rolePlannings[roleId], planning);
	// 		rolePlannings[roleId] = [...planning];

	// 		if (changes.length > 0) {
	// 			const removed = changes.filter(
	// 				(change) => change.type === ChangeType.Removed
	// 			);

	// 			const added = changes.filter(
	// 				(change) => change.type === ChangeType.Added
	// 			);

	// 			const discordUsers = await User.find({
	// 				promoRoleId: roleId,
	// 				notifyByDiscord: true,
	// 			});

	// 			const emailUsers = await User.find({
	// 				promoRoleId: roleId,
	// 				notifyByEmail: true,
	// 			});

	// 			if (emailUsers.length > 0) {
	// 				sendMail(
	// 					emailUsers.filter((u) => u.email).map((u) => <string>u.email),
	// 					{
	// 						subject: "Nouveaux changements d'emploi du temps",
	// 						html:
	// 							"<h1>Nouveaux changements d'emploi du temps</h1>" +
	// 							(removed.length > 0
	// 								? "<h2>Cours supprimés</h2><div>" +
	// 								  removed
	// 										.map(
	// 											(change) =>
	// 												`<li>${change.item.title} - Salle: ${change.item.room} - ${change.item.date}</li>`
	// 										)
	// 										.join("") +
	// 								  "</div>"
	// 								: "") +
	// 							(added.length > 0
	// 								? "<h2>Cours ajoutés</h2><div>" +
	// 								  added
	// 										.map(
	// 											(change) =>
	// 												`<li>${change.item.title} - Salle: ${change.item.room} - ${change.item.date}</li>`
	// 										)
	// 										.join("") +
	// 								  "</div>"
	// 								: "") +
	// 							`<div><p>Si vous avez des doutes quant à vôtre emploi du temps, merci de consulter <a href="${role.url}">ce site</a>.</p><p>Le code souce github est valable sur <a href="https://github.com/du-cassoulet/planning-bot">ce lien</a>.</p><div>`,
	// 					}
	// 				);
	// 			}

	// 			for (const userData of discordUsers) {
	// 				const user = await client.users.fetch(userData.discordId, {
	// 					cache: true,
	// 				});

	// 				await user.send({
	// 					content:
	// 						"# <:online:1109406525170130944> Nouveaux changements d'emploi du temps" +
	// 						(removed.length > 0
	// 							? "\n## <:eventminus:1150164950921269299> Cours supprimés\n" +
	// 							  removed
	// 									.map(
	// 										(change) =>
	// 											`- ${change.item.title} - Salle: ${change.item.room} - ${change.item.date}`
	// 									)
	// 									.join("\n") +
	// 							  "\n"
	// 							: "") +
	// 						(added.length > 0
	// 							? "\n## <:eventplus:1150164948606005259> Cours ajoutés\n" +
	// 							  added
	// 									.map(
	// 										(change) =>
	// 											`- ${change.item.title} - Salle: ${change.item.room} - ${change.item.date}`
	// 									)
	// 									.join("\n") +
	// 							  "\n"
	// 							: "") +
	// 						`Si vous avez des doutes quant à vôtre emploi du temps, merci de consulter [ce site](${role.url}).\nLe code souce github est valable sur [ce lien](https://github.com/du-cassoulet/planning-bot).`,
	// 				});
	// 			}
	// 		}
	// 	});

	// 	return setTimeout(polling, 300_000);
	// }

	// polling();

	return console.log(`${client.commands.size} commands published.`);
});
