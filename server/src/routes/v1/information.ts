import axios from "axios";
import { Router } from "express";
import { Message, RawMessage } from "../../types/Message";
import moment from "moment";
import {
	UPDATE_INTERVAL,
	GROUP_MESSAGE_MINUTES,
} from "../../constants/Information";
import { decode } from "html-entities";

const UsernameMap: { [key: string]: string } = {
	"florent.madelaine": "Florent Madelaine",
	denismonnerat: "Denis Monnerat",
	rebr45: "Régis Brouard",
	patriciacrouanveron: "Patricia Crouan-Véron",
	largesandrine: "Sandra Largé",
	"selma.iutsf": "Selma Naboulsi",
	fbgervais78: "Frédéric Gervais",
	lucdartois: "Luc Dartois",
};

const router = Router();

let lastUpdate = moment().subtract(UPDATE_INTERVAL);
let messages: Message[] = [];

async function fetchChannelMessages(): Promise<RawMessage[]> {
	const { data } = await axios.get(
		"https://discord.com/api/v9/channels/688316992184123590/messages?limit=100",
		{
			headers: {
				Authorization: process.env.DISCORD_TOKEN,
			},
		}
	);

	return data;
}

function groupMessages(messages: Message[]) {
	const groupedMessages: Message[] = [];

	let lastMessage = messages[0];
	for (let i = 1; i < messages.length; i++) {
		const message = messages[i];

		if (
			moment(lastMessage.timestamp).diff(message.timestamp, "minutes") <
				GROUP_MESSAGE_MINUTES &&
			lastMessage.author_username === message.author_username
		) {
			lastMessage.content = `${message.content}\n${lastMessage.content}`;
			lastMessage.attachments.unshift(...message.attachments);
		} else {
			groupedMessages.push(lastMessage);
			lastMessage = message;
		}
	}

	if (
		lastMessage &&
		(lastMessage.content !== "" || lastMessage.attachments.length > 0)
	) {
		groupedMessages.push(lastMessage);
	}

	return groupedMessages;
}

async function getMetaTags(url: string) {
	try {
		const { data } = await axios.get(url);

		const title: string | null =
			data.match(/<title[^>]*>([^<]+)<\/title>/)?.[1] ?? null;

		const description: string | null =
			data.match(
				/<meta (?:name="|property="og:)description" content="([^"]+)">/
			)?.[1] ?? null;

		console.log(decode(description));

		const image: string | null =
			data.match(/<meta property="og:image" content="([^"]+)">/)?.[1] ?? null;

		const themeColor: string | null =
			data.match(/<meta name="theme-color" content="([^"]+)">/)?.[1] ?? null;

		return {
			title: decode(title),
			description: decode(description),
			image,
			themeColor,
			url,
		};
	} catch {
		return {
			title: null,
			description: null,
			image: null,
			themeColor: null,
			url,
		};
	}
}

async function urlEmbeds(messageContent: string) {
	const urls = messageContent.match(/https?:\/\/[^\s]+/g);
	if (!urls) return [];

	const embeds = await Promise.all(urls.map((url) => getMetaTags(url)));

	return embeds.filter((embed) => embed.title);
}

router.get("/", async (req, res) => {
	if (moment().diff(lastUpdate) < UPDATE_INTERVAL) {
		return res.json(messages);
	}

	const rawMessages = await fetchChannelMessages();

	messages = groupMessages(
		await Promise.all(
			rawMessages
				.filter((m) => (m.content?.length ?? 0) > 64)
				.map(async (message: RawMessage) => ({
					content: message.content.replace(/[_*]{1,2}|`(?:`{2})?/g, ""),
					timestamp: moment(message.timestamp).toISOString(),
					author_username:
						UsernameMap[message.author.username] ?? message.author.username,
					author_avatar: message.author.avatar
						? `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`
						: null,
					attachments: message.attachments.map((attachment) => ({
						filename: attachment.filename,
						url: attachment.url,
						height: attachment.height,
						width: attachment.width,
						type: attachment.content_type,
						size: attachment.size,
					})),
					embeds: await urlEmbeds(message.content),
				}))
		)
	);

	lastUpdate = moment();

	return res.json(messages);
});

export default router;
