import Discord from "discord.js";
import Event from "../classes/Event";

export default new Event(
	Discord.Events.InteractionCreate,
	async (client, slash: Discord.Interaction) => {
		if (slash.isChatInputCommand()) {
			const command = client.commands.get(slash.commandName);
			if (!command?.execute) return;

			return command.execute({ client, slash });
		} else if (slash.isAutocomplete()) {
			const command = client.commands.get(slash.commandName);
			if (!command?.autocomplete) return;

			return command.autocomplete({ client, slash });
		} else if (slash.isModalSubmit()) {
			const modal = client.modals.get(slash.customId);
			if (!modal?.execute) return;

			return modal.execute({ client, slash });
		}
	}
);
