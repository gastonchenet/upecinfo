type RawAttachment = {
	id: string;
	filename: string;
	size: number;
	url: string;
	proxy_url: string;
	width: number;
	height: number;
	content_type: string;
	placeholder: string;
	placeholder_version: number;
};

type RawReaction = {
	emoji: { id: string | null; name: string };
	count: number;
	count_details: { burst: number; normal: number };
	burst_colors: string[];
	me_burst: boolean;
	burst_me: boolean;
	me: boolean;
	burst_count: 0;
};

type RawUser = {
	id: string;
	username: string;
	avatar: string | null;
	discriminator: string;
	public_flags: number;
	premium_type: number;
	flags: number;
	banner: string | null;
	accent_color: string | null;
	global_name: string;
	avatar_decoration_data: string | null;
	banner_color: string | null;
};

type RawMessage = {
	id: string;
	type: number;
	content: string;
	channel_id: string;
	author: RawUser;
	attachments: RawAttachment[];
	embeds: any[];
	mentions: any[];
	mention_roles: any[];
	pinned: boolean;
	mention_everyone: boolean;
	tts: boolean;
	timestamp: string;
	edited_timestamp: string | null;
	flags: number;
	components: any[];
	reactions: RawReaction[];
};

type Attachment = {
	filename: string;
	url: string;
	height: number;
	width: number;
	type: string;
	size: number;
};

type Embed = {
	title: string | null;
	description: string | null;
	image: string | null;
	themeColor: string | null;
	url: string;
};

type Message = {
	content: string;
	timestamp: string;
	author_username: string;
	author_avatar: string | null;
	attachments: Attachment[];
	embeds: Embed[];
};

export type {
	RawMessage,
	Message,
	Attachment,
	RawAttachment,
	RawUser,
	RawReaction,
};
