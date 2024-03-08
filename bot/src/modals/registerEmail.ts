import Modal from "../classes/Modal";
import User from "../models/User";
import { ActionRow } from "../types";

export default new Modal()
	.setData((modal) =>
		modal
			.setTitle("Enregistrer votre email")
			.setCustomId("register-email")
			.setComponents(
				<ActionRow>(
					new Modal.ActionRowBuilder().setComponents(
						new Modal.TextInputBuilder()
							.setCustomId("email-field")
							.setStyle(Modal.TextInputStyle.Short)
							.setLabel("Adresse email")
							.setPlaceholder("john.doe@etu.u-pec.fr")
							.setRequired(true)
					)
				)
			)
	)
	.setExecute(async ({ client, slash }) => {
		const email = slash.fields.getTextInputValue("email-field");
		const userExists = await User.exists({ discordId: slash.user.id });

		if (userExists) {
			await User.findOneAndUpdate(
				{ discordId: slash.user.id },
				{ email, notifyByEmail: true }
			);
		} else {
			const doc = new User({
				discordId: slash.user.id,
				email,
				notifyByEmail: true,
			});

			await doc.save();
		}

		client.emit(`emailUpdate-${slash.user.id}`, email);
		await slash.deferUpdate();
	});
