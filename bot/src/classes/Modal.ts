import Discord from "discord.js";
import { ModalData, ModalExecute } from "../types";

export default class Modal {
	static ActionRowBuilder = Discord.ActionRowBuilder;
	static TextInputBuilder = Discord.TextInputBuilder;
	static TextInputStyle = Discord.TextInputStyle;

	public data: Discord.ModalBuilder | null;
	public execute: ModalExecute | null;

	constructor() {
		this.data = null;
		this.execute = null;
	}

	public setData(callback: ModalData) {
		this.data = callback(new Discord.ModalBuilder());
		return this;
	}

	public setExecute(callback: ModalExecute) {
		this.execute = callback;
		return this;
	}
}
