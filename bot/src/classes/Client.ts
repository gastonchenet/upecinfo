import Discord from "discord.js";
import Command from "./Command";
import fs from "fs";
import path from "path";
import Event from "./Event";
import mongoose from "mongoose";
import Modal from "./Modal";

export default class Client extends Discord.Client {
	public commands: Discord.Collection<string, Command & { file: string }>;
	public modals: Discord.Collection<string, Modal & { file: string }>;

	constructor() {
		const intents = [
			Discord.IntentsBitField.Flags.Guilds,
			Discord.IntentsBitField.Flags.GuildMessages,
			Discord.IntentsBitField.Flags.GuildMembers,
		];

		super({ intents });

		this.commands = new Discord.Collection();
		this.modals = new Discord.Collection();
	}

	private fetchData(root: string, collection: Discord.Collection<string, any>) {
		const dirs = fs.readdirSync(root);

		dirs.forEach((dir) => {
			const dirPath = path.join(root, dir);

			if (fs.lstatSync(dirPath).isDirectory()) {
				return this.fetchCommands(dirPath);
			} else {
				const element = require(dirPath).default;
				if (!element.data) return;

				return collection.set(
					element.data.name ?? element.data.data?.custom_id,
					{ ...element, file: dir }
				);
			}
		});
	}

	private fetchCommands(root = path.join(__dirname, "../commands")) {
		this.fetchData(root, this.commands);
	}

	private fetchModals(root = path.join(__dirname, "../modals")) {
		this.fetchData(root, this.modals);
	}

	private fetchEvents(root = path.join(__dirname, "../events")) {
		const dirs = fs.readdirSync(root);

		dirs.forEach((dir) => {
			const dirPath = path.join(root, dir);

			if (fs.lstatSync(dirPath).isDirectory()) {
				return this.fetchCommands(dirPath);
			} else {
				const event: Event = require(dirPath).default;

				return this.on(<keyof Discord.ClientEvents>event.eventName, (...args) =>
					event.execute(this, ...args)
				);
			}
		});
	}

	private async connectDb() {
		const start = Date.now();

		await mongoose.connect(
			`mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}.mongodb.net/production?retryWrites=true&w=majority&appName=upecinfo`
		);

		console.log(`Connected to the database in ${Date.now() - start}ms.`);
	}

	public async start(token?: string) {
		this.fetchEvents();
		this.fetchCommands();
		this.fetchModals();

		await this.connectDb();

		this.login(token);
	}
}
