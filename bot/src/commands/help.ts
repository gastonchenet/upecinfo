import Discord from "discord.js";
import Command from "../classes/Command";

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export default new Command()
	.setData(
		(slash) => <Discord.SlashCommandBuilder>slash
				.setName("help")
				.setDescription(
					"Pour obtenir de l'aide sur le bot ou sur une commande."
				)
				.setDMPermission(false)
				.setNSFW(false)
				.addStringOption((option) =>
					option
						.setName("command")
						.setDescription(
							"La commande pour laquelle vous avez besoin d'aide."
						)
						.setRequired(false)
						.setAutocomplete(true)
				)
	)
	.setDetails((details) =>
		details.setDocumentation(
			{
				label: "A quoi ça sert ?",
				icon: "<:neonredsparkles:1150387167735070870>",
				value:
					"Cette commande permet d'afficher soit une **liste des commandes** disponibles sur le bot, soit d'afficher des **information complémentaires** sur une **commande en particulier**. Si vous souhaitez simplement avoir une **liste des commandes**, exécutez cette commande **sans remplir** l'argument optionnel \"commande\". Si au contraire, vous souhaitez avoir de l'aide quant à **l'utilisation** d'une commande, exécutez-la avec le **nom** de la commande pour laquelle vous voulez des informations dans l'argument optionnel \"commande\".",
			},
			{
				label: "Comment ça fonctionne ?",
				icon: "<:neonredactivedev:1150389568911192164>",
				value:
					"Le programme verifie si une **valeur** a été attribuée à l'argument \"commande\". Si oui, le nom de la commande est recherché dans la **liste des commandes** disponibles, si elle n'est **pas** trouvée, une **erreur** s'affichera. Sinon, les données de cette commande seront affichées en format **textuel lisible et compréhensible**. Si **aucune** valeur ne lui est attribuée, le programme affichera la **liste des commandes**, leur **description** ainsi que quelques **informations complémentaires** sur le bot.",
			}
		)
	)
	.setAutocomplete(({ client, slash }) => {
		const query = slash.options.getFocused(false);
		const commands = client.commands.filter((c) =>
			clean(<string>c.data?.name).startsWith(clean(query))
		);

		return slash.respond(
			commands
				.map((c) => ({
					name: <string>c.data?.name,
					value: <string>c.data?.name,
				}))
				.slice(0, 25)
		);
	})
	.setExecute(async ({ client, slash }) => {
		const commandName = slash.options.getString("command", false);

		if (commandName) {
			const command = client.commands.get(commandName);

			if (!command) {
				return slash.reply({
					content:
						"## <:cross:896682404410982450> Erreur\nTu ne peux pas avoir d'aide sur une commande qui n'existe pas.",
					ephemeral: true,
				});
			}

			const commandId = client.application?.commands.cache.find(
				(c) => c.name === command.data?.name
			)?.id;

			return slash.reply({
				content: `# <:info:1089119342756638730> Aide pour la commande </${
					command.data?.name
				}:${commandId}>\n*${
					command.data?.description
				}*\n\n${command.details?.documentation
					?.map((d) => `## ${d.icon} ${d.label}\n${d.value}`)
					.join(
						"\n"
					)}\n\nLe code source de cette commande est disponible sur [cette page](https://github.com/du-cassoulet/planning-bot/blob/main/src/commands/${
					command.file
				}).`,
			});
		} else {
			await client.application?.fetch();

			return slash.reply({
				content: `# <:info:1089119342756638730> Aide générale\n*${client.user?.toString()} est un bot créé bénévolement par ${client.application?.owner?.toString()} qui a pour but de faciliter l'accès et l'utilisation de l'emploi du temps.*\n## <:neonredbot:1150502017605828780> Commandes disponibles\n${client.application?.commands.cache
					.map(
						(command) =>
							`- </${command.name}:${command.id}> *${command.description}*`
					)
					.join(
						"\n"
					)}\n## <:neonredactivedev:1150389568911192164> Comment ça fonctionne ?\nLe bot utilise le langage de programmation [TypeScript](<https://www.typescriptlang.org>) compilé en [JavaScript](<https://fr.wikipedia.org/wiki/JavaScript>) et interprété par [Node.js](<https://nodejs.org>). Il utilise [discord.js](<https://discord.js.org>) pour se connecter au [WebSocket](<https://fr.wikipedia.org/wiki/WebSocket>) de discord. Afin de stocker les données essentielles comme l'adresse email ou encore la promo de l'étudiant, une base de données [NoSQL](<https://fr.wikipedia.org/wiki/NoSQL>) [Mongo DB](<https://www.mongodb.com>) est utilisée.\n\nLe code source de cette commande est disponible sur [cette page](https://github.com/du-cassoulet/planning-bot).`,
			});
		}
	});
