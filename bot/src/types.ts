import Discord from "discord.js";
import { CommandDetailsBuilder } from "./classes/Command";
import Client from "./classes/Client";

export enum Campus {
	Sen = "sen",
	Fbl = "fbl",
}

export type RawClassSenHeader = {
	left: string;
	center: string;
	right: string;
};

export type RawClassSenEvent = {
	title: string;
	start: string;
	end: string;
};

export type RawClassSen = {
	header: RawClassSenHeader;
	defaultDate: string;
	defaultView: string;
	scrollTime: string;
	minTime: string;
	maxTime: string;
	navLinks: boolean;
	locale: string;
	noEventsMessage: string;
	hiddenDays: number[];
	editable: boolean;
	eventLimit: boolean;
	events: RawClassSenEvent[];
};

export type RawClassFbl = {
	end: string;
	nomADE: string;
	numero: string;
	resourceId: string;
	salle: string;
	start: string;
	title: string;
};

export type ClassTime = {
	startHours: number;
	startMin: number;
	endHours: number;
	endMin: number;
};

export type Class = {
	time: ClassTime;
	day: number;
	title: string;
	room: string;
	details: string;
	date: string;
};

export type CommandData = (
	slash: Discord.SlashCommandBuilder
) => Discord.SlashCommandBuilder;

export type CommandDetails = (
	details: CommandDetailsBuilder
) => CommandDetailsBuilder;

export type CommandExecute = (data: {
	client: Client;
	slash: Discord.ChatInputCommandInteraction;
}) => any;

export type AutocompleteExecute = (data: {
	client: Client;
	slash: Discord.AutocompleteInteraction;
}) => any;

export type ModalData = (slash: Discord.ModalBuilder) => Discord.ModalBuilder;

export type ModalExecute = (data: {
	client: Discord.Client;
	slash: Discord.ModalSubmitInteraction;
}) => any;

export type MailPayload = {
	subject: string;
	html: string;
};

export type UserData = {
	discordId: string;
	notifyByDiscord: boolean;
	notifyByEmail: boolean;
	email?: string | undefined;
};

export type ActionRow = Discord.ActionRowBuilder<any>;

export enum ChangeType {
	Added = "Added",
	Removed = "Removed",
}

export type PlanningChange = {
	type: ChangeType;
	item: Class;
};

export type CommandDetail = {
	label: string;
	icon: string;
	value: string;
};

export enum Campus {
	Senart = "sen",
	Fontainebleau = "fbl",
}

export type PlanningEvent = {
	start: string;
	end: string;
	summary: string;
	location: string;
	teacher: string;
};

export type Planning = { [key: string]: PlanningEvent[] };
