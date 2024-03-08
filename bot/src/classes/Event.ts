import Discord from "discord.js";
import Client from "./Client";

type ExecuteFunction = (client: Client, ...args: any[]) => any;

export default class Event {
	public eventName: Discord.Events;
	public execute: ExecuteFunction;

	constructor(eventName: Discord.Events, execute: ExecuteFunction) {
		this.eventName = eventName;
		this.execute = execute;
	}
}
