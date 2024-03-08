import { ModalBuilder } from "discord.js";
import Command from "../classes/Command";
import registerEmail from "../modals/registerEmail";

export default new Command()
	.setData((slash) =>
		slash
			.setName("email")
			.setDescription("Pour changer votre adresse email.")
			.setDMPermission(false)
			.setNSFW(false)
	)
	.setDetails((details) =>
		details.setDocumentation(
			{
				label: "Comment l'utiliser ?",
				icon: "<:neonredcheckmark:1150387169882554379>",
				value:
					"Directement après avoir exécuté l'application, une page dans laquelle une **adresse email** est demandée s'ouvre. Il vous suffit simplement de rentrer une **adresse email** sur laquelle vous souhaiteriez recevoir des **notifications**, puis d'accepter. L'email sera directement **enregistrée** dans la **base de données**.",
			},
			{
				label: "A quoi ça sert ?",
				icon: "<:neonredsparkles:1150387167735070870>",
				value:
					"Cette commande permet de **modifier** ou **d'ajouter** une **adresse email** à l'élément de l'utilisateur dans la **base de données**. Cet email est utilisé par l'outil de **notification** du bot et vient en complément à la commande du même nom.",
			},
			{
				label: "Comment ça fonctionne ?",
				icon: "<:neonredactivedev:1150389568911192164>",
				value: `Le programme répond à cette commande par **l'ouverture** d'un [modal](<https://discordjs.guide/interactions/modals.html>) dans lequel une **adresse email** est demandée. Une fois la validation des informations rentrées dans le **modal**, le programme **interceptera** l'évènement qu'il aura généré et **récoltera les informations** pour pouvoir les ajouter dans la [base de données](<https://www.mongodb.com>). Un **message de confirmation** est ensuite envoyé à l'utilisateur sur Discord.`,
			}
		)
	)
	.setExecute(({ client, slash }) => {
		slash.showModal(<ModalBuilder>registerEmail.data);

		async function sendValidationMessage(email: string) {
			await slash.user.send({
				content: `## :email: Changement d'adresse email\nVotre adresse email est maintenant **${email}**.`,
			});

			return client.removeListener(
				`emailUpdate-${slash.user.id}`,
				sendValidationMessage
			);
		}

		client.addListener(`emailUpdate-${slash.user.id}`, sendValidationMessage);

		setTimeout(() => {
			client.removeListener(
				`emailUpdate-${slash.user.id}`,
				sendValidationMessage
			);
		}, 180_000);
	});
