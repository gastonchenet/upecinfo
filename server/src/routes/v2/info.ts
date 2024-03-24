import axios, { type AxiosResponse } from "axios";
import { Router } from "express";
import { Message, RawMessage } from "../../types/Message";
import moment, { type Moment } from "moment";
import {
	UPDATE_INTERVAL,
	GROUP_MESSAGE_MINUTES,
	INBOX_START_DATE,
	MIN_CONTENT_LENGTH,
	USERNAME_MAP,
} from "../../constants/Information";
import { decode } from "html-entities";
import PromosInfo, {
	SECTOR_DISCORD_CHANNEL as INFO_SECTOR_DISCORD_CHANNEL,
} from "../../constants/Planning/Info";
import PromosMmi from "../../constants/Planning/Mmi";
import PromosTc from "../../constants/Planning/Tc";
import { type Promo, Sector } from "../../types/Planning";

const SectorsChannels = Object.freeze({
	[Sector.Info]: INFO_SECTOR_DISCORD_CHANNEL,
	[Sector.Mmi]: null,
	[Sector.Tc]: null,
});

const Promos = Object.freeze({
	[Sector.Info]: PromosInfo,
	[Sector.Tc]: PromosTc,
	[Sector.Mmi]: PromosMmi,
});

type Identidier = `${Sector}${string}`;

const router = Router();
const updates = new Map<Identidier, Moment>();
const messages = new Map<Identidier, Message[]>();

async function filterPromoRequest(
	request: Promise<AxiosResponse<any, any>>,
	promo: Promo
) {
	if (!promo?.info?.role) return { data: [] };
	const { data } = await request;

	return {
		data: data.filter((message: RawMessage) => {
			if (!new RegExp(`<@&${promo.info!.role}>`).test(message.content))
				return false;

			if (!USERNAME_MAP[message.author.username]) return false;

			return true;
		}),
	};
}

async function fetchChannelMessages(
	sector: Sector | null,
	promoNotificationChannel: string | null
): Promise<RawMessage[]> {
	if (!sector || !SectorsChannels[sector]) return [];

	const requests: Promise<{ data: any }>[] = [
		axios.get(
			`https://discord.com/api/v9/channels/${SectorsChannels[sector]}/messages?limit=100`,
			{ headers: { Authorization: process.env.DISCORD_TOKEN } }
		),
	];

	const promo = Promos[sector]?.find(
		(promo) => promo.notificationChannel === promoNotificationChannel
	);

	if (promo?.info?.channel) {
		requests.push(
			filterPromoRequest(
				axios.get(
					`https://discord.com/api/v9/channels/${promo.info.channel}/messages?limit=100`,
					{ headers: { Authorization: process.env.DISCORD_TOKEN } }
				),
				promo
			)
		);
	}

	const responses = await Promise.all(requests);

	return responses.map((response) => response.data).flat();
}

function groupMessages(messages: Message[]) {
	const groupedMessages: Message[] = [];

	let lastMessage = messages[0];
	for (let i = 1; i <= messages.length; i++) {
		const message = messages[i];

		if (
			message &&
			moment(lastMessage.timestamp).diff(message.timestamp, "minutes") <
				GROUP_MESSAGE_MINUTES &&
			lastMessage.author_username === message.author_username
		) {
			lastMessage.content = `${message.content}\n${lastMessage.content}`;
			lastMessage.attachments.unshift(...message.attachments);
		} else {
			if (
				lastMessage.content.length > MIN_CONTENT_LENGTH ||
				lastMessage.attachments.length > 0
			) {
				groupedMessages.push(lastMessage);
			}

			lastMessage = message;
		}
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
	const sector = (req.query.sector?.toString() as Sector) ?? null;
	const promo = req.query.promo?.toString() ?? null;
	const identifier: Identidier = `${sector}${promo}`;
	const lastUpdate = updates.get(identifier) ?? moment(0);

	if (moment().diff(lastUpdate) < UPDATE_INTERVAL) {
		return res.json(messages.get(identifier));
	}

	const rawMessages = await fetchChannelMessages(sector, promo);

	messages.set(
		identifier,
		groupMessages(
			await Promise.all(
				rawMessages
					.filter((m) => moment(m.timestamp).isAfter(INBOX_START_DATE))
					.sort((a, b) => moment(b.timestamp).diff(a.timestamp))
					.map(async (message: RawMessage) => ({
						content: message.content
							.replace(
								/(?:[_*]{1,2})|(?:`(?:`{2})?)|(?:\s*<@&\d+>\s*)|(?:,$)/g,
								""
							)
							.trim(),
						timestamp: moment(message.timestamp).toISOString(),
						author_username:
							USERNAME_MAP[message.author.username] ?? message.author.username,
						author_avatar: message.author.avatar
							? `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`
							: null,
						attachments: message.attachments.map((attachment) => ({
							filename: attachment.filename.trim(),
							url: attachment.url,
							height: attachment.height,
							width: attachment.width,
							type: attachment.content_type,
							size: attachment.size,
						})),
						embeds: await urlEmbeds(message.content),
					}))
			)
		)
	);

	updates.set(identifier, moment());

	return res.json(messages.get(identifier));
});

export default router;
