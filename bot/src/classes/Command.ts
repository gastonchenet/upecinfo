import Discord from "discord.js";
import {
	AutocompleteExecute,
	CommandData,
	CommandDetail,
	CommandDetails,
	CommandExecute,
} from "../types";

export class CommandDetailsBuilder {
	public documentation: CommandDetail[] | null = null;

	constructor() {}

	public setDocumentation(...documentation: CommandDetail[]) {
		this.documentation = documentation;
		return this;
	}
}

export default class Command {
	public data: Discord.SlashCommandBuilder | null = null;
	public execute: CommandExecute | null = null;
	public autocomplete: AutocompleteExecute | null = null;
	public details: CommandDetailsBuilder | null = null;

	constructor() {}

	public setData(callback: CommandData) {
		this.data = callback(new Discord.SlashCommandBuilder());
		return this;
	}

	public setDetails(callback: CommandDetails) {
		this.details = callback(new CommandDetailsBuilder());
		return this;
	}

	public setExecute(callback: CommandExecute) {
		this.execute = callback;
		return this;
	}

	public setAutocomplete(callback: AutocompleteExecute) {
		this.autocomplete = callback;
		return this;
	}
}
