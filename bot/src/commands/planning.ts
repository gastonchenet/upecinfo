import Discord from "discord.js";
import Command from "../classes/Command";
import makeCanvas from "../utils/makeCanvas";
import type { ActionRow, PlanningEvent } from "../types";
import type { Promo } from "../roles";
import { MAX_WEEKS } from "../constants";
import roles from "../roles";
import moment from "moment";
import fetchPlanning from "../utils/fetchPlanning";

export default new Command()
	.setData((slash) =>
		slash
			.setName("planning")
			.setDescription("Pour avoir l'emploi du temps")
			.setDMPermission(false)
			.setNSFW(false)
	)
	.setDetails((details) =>
		details.setDocumentation(
			{
				label: "Comment l'utiliser ?",
				icon: "<:neonredcheckmark:1150387169882554379>",
				value:
					"Vous ne pouvez utiliser cette commande que si vous avez **le role de votre promo**. Si ce n'est pas le cas, adressez vous à un des **administrateur** du serveur qui vous octroiera votre role. Verifiez aussi que le rôle que vous possédez est **supporté** par le bot, pour cela vous pouvez contacter le **créateur du bot** ou un **administrateur** du serveur.",
			},
			{
				label: "A quoi ça sert ?",
				icon: "<:neonredsparkles:1150387167735070870>",
				value:
					"Cette commande permet d'afficher **l'emploi du temps** de votre promo sous forme d'une image contenant tout les cours d'une semaine.\n**Deux boutons** vous permettront **d'avancer** ou de **reculer** d'une semaine, vous ne pouvez pas voir l'emploi du temps d'une semaine déjà passée et vous ne pouvez voir que de 10 semaines en avance.",
			},
			{
				label: "Comment ça fonctionne ?",
				icon: "<:neonredactivedev:1150389568911192164>",
				value:
					"Tout d'abord, le programme recherche si l'utilisateur possède un **role** pouvant indiquer sa promo, si non, une **erreur** est renvoyée. Ensuite en faisant des requêtes [GET](<https://fr.wikipedia.org/wiki/Hypertext_Transfer_Protocol>) aux sites d'emploi du temps de [Fontainebleau](<http://www.iut-fbleau.fr/EDT/consulter>) et de [Sénart](<https://dynasis.iutsf.org/index.php?group_id=6&id=14>), nous récupérons les valeurs [JSON](<https://fr.wikipedia.org/wiki/JavaScript_Object_Notation>) des **emplois du temps** de ceux-ci. Le programme formate ensuite les réponses pour les rendre **compatibles**. La librairie [canvas](<https://www.npmjs.com/package/canvas>) est ensuite utilisée afin de convertir ces données en une **image** lisible.",
			}
		)
	)
	.setExecute(async ({ slash }) => {
		let nextWeek = 0;
		let promo: Promo | null = null;

		for (const [roleId] of (
			slash.member?.roles as Discord.GuildMemberRoleManager
		).cache) {
			if (roleId in roles) {
				promo = roles[roleId];
				break;
			}
		}

		if (!promo) {
			return slash.reply({
				content:
					"## <:cross:896682404410982450> Erreur\nJe n'ai pas réussi à reconnaître ta promo, assure toi d'avoir les bons rôles.\nSi le problème persiste, merci de bien vouloir contacter <@532631412717649941>.",
				ephemeral: true,
			});
		}

		const planningData = await fetchPlanning(promo);

		if (!planningData) {
			return slash.reply({
				content:
					"## <:cross:896682404410982450> Erreur\nJe n'ai pas réussi à récupérer l'emploi du temps, assure toi que le site est en ligne.\nSi le problème persiste, merci de bien vouloir contacter <@532631412717649941>.",
				ephemeral: true,
			});
		}

		await slash.deferReply({ ephemeral: true });

		const { planning, url } = planningData;

		async function makePlanning(
			promo: Promo,
			nextWeek: number,
			button: Discord.ButtonInteraction | null,
			disabled: boolean
		) {
			const startOfWeek = moment()
				.add(nextWeek, "week")
				.locale("fr")
				.startOf("week");

			const endOfWeek = moment()
				.add(nextWeek, "week")
				.locale("fr")
				.endOf("week");

			const week: PlanningEvent[] = [];

			Array.from({ length: endOfWeek.diff(startOfWeek, "days") + 1 }, (_, i) =>
				startOfWeek.clone().add(i, "days")
			).forEach((dayDate) =>
				week.push(...(planning[dayDate.format("YYYY-MM-DD")] ?? []))
			);

			const content:
				| string
				| Discord.InteractionReplyOptions
				| Discord.MessagePayload = {
				content: `## <:beta1:1143159356431536198><:beta2:1143159353990447165><:beta3:1143159352337911859> L'application est encore dans sa beta.\nSi vous avez des doutes quant à vôtre emploi du temps, merci de consulter [ce site](${url}).\nLe code souce github est valable sur [ce lien](https://github.com/du-cassoulet/planning-bot).\n# <:education:1150018279948173445> ${
					promo.name
				}\n### *${startOfWeek.format("Do MMMM")} - ${endOfWeek.format(
					"Do MMMM"
				)}*`,
				components: [<ActionRow>new Discord.ActionRowBuilder().setComponents(
						new Discord.ButtonBuilder()
							.setStyle(Discord.ButtonStyle.Primary)
							.setLabel("🠐 Précédente Semaine")
							.setCustomId("previous")
							.setDisabled(disabled || nextWeek <= 0),
						new Discord.ButtonBuilder()
							.setStyle(Discord.ButtonStyle.Primary)
							.setLabel("Prochaine Semaine 🠒")
							.setCustomId("next")
							.setDisabled(disabled || nextWeek >= MAX_WEEKS - 1)
					)],
				files: [
					new Discord.AttachmentBuilder(await makeCanvas(week), {
						name: `planning-${startOfWeek.format(
							"DD-MM-YY"
						)}-${endOfWeek.format("DD-MM-YY")}.png`,
					}),
				],
			};

			if (button) {
				return button.update(
					<
						Discord.InteractionUpdateOptions & {
							fetchReply: true;
						}
					>content
				);
			}

			return slash.editReply(content);
		}

		const reply = await makePlanning(promo, nextWeek, null, false);

		const collector = reply.createMessageComponentCollector({
			time: 180_000,
			componentType: Discord.ComponentType.Button,
		});

		collector.on("collect", async (button) => {
			collector.resetTimer();

			switch (button.customId) {
				case "previous":
					nextWeek--;
					break;

				case "next":
					nextWeek++;
					break;
			}

			await makePlanning(<Promo>promo, nextWeek, button, false);
		});

		collector.on("end", async () => {
			try {
				await makePlanning(<Promo>promo, nextWeek, null, true);
			} catch {}
		});
	});
