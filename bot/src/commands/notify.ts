import Discord from "discord.js";
import Command from "../classes/Command";
import User from "../models/User";
import { ActionRow, UserData } from "../types";
import registerEmail from "../modals/registerEmail";
import roles from "../roles";

export default new Command()
	.setData((slash) =>
		slash
			.setName("notify")
			.setDescription(
				"Pour recevoir des notifications lors des modifications de l'emploi du temps."
			)
			.setDMPermission(false)
			.setNSFW(false)
	)
	.setDetails((details) =>
		details.setDocumentation(
			{
				label: "Comment l'utiliser ?",
				icon: "<:neonredcheckmark:1150387169882554379>",
				value:
					"Lors de l'utilisation de cette commande, un **menu** avec **deux boutons** est affiché. Un bouton pour activer/désactiver les notifications sur **Discord**, et un autre pour activer/désactiver les notifications par **email**. Si **aucune** adresse email n'est enregistrée à vôtre nom dans la **base de données**, celle-ci vous sera **demandée** via ce même bouton.",
			},
			{
				label: "A quoi ça sert ?",
				icon: "<:neonredsparkles:1150387167735070870>",
				value:
					"Cette commande vous permet de recevoir des notifications lorsque des changements seront effectués dans les emplois du temps de votre promo, que vous soyez sur le site de [Fontainebleau](<http://www.iut-fbleau.fr/EDT/consulter>) ou celui de [Sénart](<https://dynasis.iutsf.org/index.php?group_id=6&id=14>) et de gérer par quel moyen vous les recevrez, les moyens disponibles sont par Discord ou par email.",
			},
			{
				label: "Comment ça fonctionne ?",
				icon: "<:neonredactivedev:1150389568911192164>",
				value:
					"Tout d'abord, le programme recherche si l'utilisateur possède un **role** indiquant sa promo, si non, une **erreur** est renvoyée. Ensuite un message comportant **deux boutons** est envoyé, un [component collector](<https://tinyurl.com/29m8az8r>) récolte chaque **interactions de boutons** et fait basculer les valeurs corresondantes au **type** de notifications dans la [base de données](<https://www.mongodb.com>). Une boucle d'intervalle de 5 minutes se lance lorsque l'évènement [ready](<https://tinyurl.com/4av9cen6>) vérifie quels cours ont été changés et envoie une notification aux utilisateurs ayant les valeurs correspondantes dans la base de données.",
			}
		)
	)
	.setExecute(async ({ client, slash }) => {
		let user = await User.findOne({ discordId: slash.user.id });
		let promoId: string | null = null;

		for (const [roleId] of (
			slash.member?.roles as Discord.GuildMemberRoleManager
		).cache) {
			if (roleId in roles) {
				promoId = roleId;
				break;
			}
		}

		if (!promoId) {
			return slash.reply({
				content:
					"## <:cross:896682404410982450> Erreur\nJe n'ai pas réussi à reconnaître ta promo, assure toi d'avoir les bons rôles.\nSi le problème persiste, merci de bien vouloir contacter <@532631412717649941>.",
				ephemeral: true,
			});
		}

		if (!user) {
			const doc = new User({ discordId: slash.user.id, promoRoleId: promoId });
			user = await doc.save();
		} else if (!user.promoRoleId) {
			user.set("promoRoleId", promoId);
			await user.save();
		}

		const messageData = (user: UserData, disabled: boolean) => ({
			content: `## <:beta1:1143159356431536198><:beta2:1143159353990447165><:beta3:1143159352337911859> L'application est encore dans sa beta.\nSi vous avez des doutes quant à vôtre emploi du temps, merci de consulter [ce site](${
				roles[<string>promoId].url
			}).\nLe code souce github est valable sur [ce lien](https://github.com/du-cassoulet/planning-bot).\n# :email: Notifications\nPour recevoir des notifications lorsque l'emploi du temps est modifié.`,
			ephemeral: true,
			components: [<ActionRow>new Discord.ActionRowBuilder().setComponents(
					new Discord.ButtonBuilder()
						.setCustomId("toggle-discord")
						.setStyle(
							user.notifyByDiscord
								? Discord.ButtonStyle.Success
								: Discord.ButtonStyle.Danger
						)
						.setLabel(
							user.notifyByDiscord
								? "Notifications par Discord activées"
								: "Notifications par Discord désactivées"
						)
						.setDisabled(disabled),
					new Discord.ButtonBuilder()
						.setCustomId("toggle-email")
						.setStyle(
							!user.email
								? Discord.ButtonStyle.Secondary
								: user.notifyByEmail
								? Discord.ButtonStyle.Success
								: Discord.ButtonStyle.Danger
						)
						.setLabel(
							!user.email
								? "Notifications par Email"
								: user.notifyByEmail
								? "Notifications par Email activées"
								: "Notifications par Email désactivées"
						)
						.setDisabled(disabled)
				)],
		});

		const reply = await slash.reply(messageData(user, false));

		async function updateMessageData() {
			user = await User.findOne({ discordId: slash.user.id });
			await slash.editReply(messageData(<UserData>user, false));

			return client.removeListener(
				`emailUpdate-${slash.user.id}`,
				updateMessageData
			);
		}

		client.addListener(`emailUpdate-${slash.user.id}`, updateMessageData);

		const collector = reply.createMessageComponentCollector({
			time: 180_000,
		});

		collector.on("collect", async (button) => {
			collector.resetTimer();

			switch (button.customId) {
				case "toggle-discord":
					user?.set("notifyByDiscord", !user.notifyByDiscord);
					await user?.save();
					await button.update(messageData(<UserData>user, false));
					break;

				case "toggle-email":
					if (!user?.email) {
						return button.showModal(<Discord.ModalBuilder>registerEmail.data);
					}

					user?.set("notifyByEmail", !user.notifyByEmail);
					await user?.save();
					await button.update(messageData(<UserData>user, false));

					break;
			}
		});

		collector.on("end", async () => {
			client.removeListener(`emailUpdate-${slash.user.id}`, updateMessageData);

			try {
				await slash.editReply(messageData(<UserData>user, true));
			} catch {}
		});
	});
