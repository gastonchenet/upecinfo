import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	ScrollView,
	Image,
	Linking,
	Pressable,
} from "react-native";
import Hyperlink from "react-native-hyperlink";
import { getItemAsync, setItemAsync } from "expo-secure-store";
import { MaterialIcons, FontAwesome6 } from "@expo/vector-icons";
import moment, { type Moment } from "moment";
import "moment/locale/fr";
import Colors from "../../constants/Colors";
import lightMode from "./styles/lightMode";
import darkMode from "./styles/darkMode";
import RipplePressable from "../../components/RipplePressable";
import PageModal from "../../components/PageModal";
import { fetchMessages } from "../../api/messages";
import type { Message } from "../../types/Message";

type InformationProps = {
	setImage: (image: { url: string; height: number; width: number }) => void;
	theme: "light" | "dark";
	selectedMessage: Message | null;
	setSelectedMessage: (message: Message | null) => void;
};

function translateSizeToBits(size: number) {
	const units = ["o", "Ko", "Mo", "Go", "To"];
	let unit = 0;

	while (size > 1024) {
		size /= 1024;
		unit++;
	}

	return `${size.toLocaleString("fr", {
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
	})} ${units[unit]}`;
}

export default function Information({
	setImage,
	theme,
	selectedMessage,
	setSelectedMessage,
}: InformationProps) {
	const [lastSeen, setLastSeen] = useState<Moment | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [styles, setStyles] = useState(lightMode);

	function selectMessage(message: Message | null) {
		setSelectedMessage(message);

		if (message && (!lastSeen || moment(message.timestamp).isAfter(lastSeen))) {
			setLastSeen(moment(message.timestamp));
			setItemAsync("last_checked", message.timestamp);
		}
	}

	function getLastChecked(): Promise<Moment | null> {
		return new Promise((resolve) => {
			getItemAsync("last_checked")
				.then((data) => {
					if (!data) return;
					resolve(moment(data));
				})
				.catch(() => {
					resolve(null);
				});
		});
	}

	useEffect(() => {
		fetchMessages().then((data) => setMessages(data));

		getLastChecked().then((lastChecked) => {
			if (!lastChecked) return;
			setLastSeen(lastChecked);
		});
	}, []);

	useEffect(() => {
		if (theme === "dark") {
			setStyles(darkMode);
		} else {
			setStyles(lightMode);
		}
	}, [theme]);

	return (
		<View style={styles.page}>
			<View style={styles.subHead}>
				<Text style={styles.subHeadDay}>Informations</Text>
			</View>
			<View style={styles.messagesContainer}>
				<ScrollView>
					{messages.map((message, index) => (
						<RipplePressable
							key={index}
							style={[
								styles.messageButton,
								{
									borderTopWidth: index === 0 ? 0 : 1,
								},
							]}
							duration={500}
							rippleColor={theme === "dark" ? "#fff1" : "#0001"}
							onPress={() => selectMessage(message)}
						>
							<Image
								source={
									message.author_avatar
										? { uri: message.author_avatar }
										: require("../../assets/images/icon.png")
								}
								style={styles.messageAvatar}
							/>
							<View style={styles.messageElement}>
								<View style={styles.messageElementHead}>
									{moment(message.timestamp).isAfter(lastSeen) && (
										<MaterialIcons
											name="circle"
											size={8}
											color={Colors.accent}
										/>
									)}
									<Text style={styles.messageUsername}>
										{message.author_username}
									</Text>
									<Text style={styles.messageTimestamp}>
										{moment(message.timestamp).format("ddd D MMM")}
									</Text>
								</View>
								{message.content.length > 0 && (
									<Text
										style={styles.messagePreview}
										numberOfLines={3}
										ellipsizeMode="tail"
									>
										{message.content
											.replace(/\n|={3,}/g, " ")
											.replace(/\s+/g, " ")}
									</Text>
								)}
								{message.attachments.length > 0 && (
									<View
										style={[
											styles.attachmentsRow,
											{
												marginTop: message.content.length > 0 ? 5 : 0,
											},
										]}
									>
										<FontAwesome6
											name="paperclip"
											size={14}
											color={Colors[theme].darkGray}
										/>
										<Text
											style={styles.attachmentsText}
											numberOfLines={3}
											ellipsizeMode="tail"
										>
											{message.attachments.length > 1
												? `${message.attachments.length} pièces jointes`
												: message.attachments[0].filename}
										</Text>
									</View>
								)}
							</View>
						</RipplePressable>
					))}
				</ScrollView>
				<PageModal
					visible={!!selectedMessage}
					onClose={() => selectMessage(null)}
					theme={theme}
					head={
						<View style={styles.messageHead}>
							<Image
								source={
									selectedMessage?.author_avatar
										? { uri: selectedMessage?.author_avatar }
										: require("../../assets/images/icon.png")
								}
								style={styles.authorAvatar}
							/>
							<View>
								<Text style={styles.messageAuthor}>
									{selectedMessage?.author_username}
								</Text>
								<Text style={styles.messageDate}>
									{moment(selectedMessage?.timestamp).format(
										"dddd Do MMMM YYYY, HH[h]mm"
									)}
								</Text>
							</View>
						</View>
					}
				>
					{selectedMessage?.content?.split(/={3,}/g).map((content, index) => (
						<Hyperlink
							linkStyle={styles.linkStyle}
							linkDefault
							style={[
								styles.messageContainer,
								{
									borderTopWidth: index === 0 ? 0 : 1,
									paddingTop: index === 0 ? 0 : 25,
								},
							]}
							key={index}
						>
							<Text style={styles.messageContent}>{content.trim()}</Text>
						</Hyperlink>
					))}
					<View style={styles.embeds}>
						{selectedMessage?.embeds.map((embed, i) => (
							<RipplePressable
								key={i}
								onPress={() => Linking.openURL(embed.url)}
								style={[
									styles.embed,
									{
										borderLeftColor: embed.themeColor || Colors.accent,
									},
								]}
								duration={500}
								rippleColor={theme === "dark" ? "#fff1" : "#0001"}
							>
								{embed.image && (
									<Image
										source={{ uri: embed.image }}
										style={styles.embedThumbnail}
										resizeMode="cover"
									/>
								)}
								<View style={styles.embedInfo}>
									<Text style={styles.embedTitle}>{embed.title}</Text>
									<Text
										style={styles.embedDescription}
										numberOfLines={3}
										ellipsizeMode="tail"
									>
										{!embed.description || embed.description === ""
											? "Aucune description"
											: embed.description}
									</Text>
								</View>
							</RipplePressable>
						))}
					</View>
					<View style={styles.attachments}>
						{selectedMessage?.attachments.map((attachment, i) =>
							attachment.type.startsWith("image/") ? (
								<Pressable
									key={i}
									onPress={() =>
										setImage({
											url: attachment.url,
											height: attachment.height,
											width: attachment.width,
										})
									}
								>
									<Image
										source={{ uri: attachment.url }}
										style={styles.attachmentImage}
										resizeMode="cover"
									/>
								</Pressable>
							) : (
								<RipplePressable
									key={i}
									onPress={() => Linking.openURL(attachment.url)}
									style={styles.attachmentFile}
									duration={500}
									rippleColor={theme === "dark" ? "#fff1" : "#0001"}
								>
									<View style={styles.attachmentIcon}>
										{attachment.type.startsWith("application/pdf") ? (
											<FontAwesome6
												name="file-pdf"
												size={20}
												color={Colors.accent}
											/>
										) : attachment.type.startsWith("application/msword") ? (
											<FontAwesome6
												name="file-word"
												size={20}
												color={Colors.accent}
											/>
										) : (
											<FontAwesome6
												name="file"
												size={20}
												color={Colors.accent}
											/>
										)}
									</View>
									<View style={styles.attachmentInfo}>
										<Text
											style={styles.attachmentFilename}
											numberOfLines={1}
											ellipsizeMode="tail"
										>
											{attachment.filename}
										</Text>
										<Text style={styles.attachmentSize}>
											{translateSizeToBits(attachment.size)}
										</Text>
									</View>
									<View style={styles.attachmentIcon}>
										<MaterialIcons
											name="download"
											size={24}
											color={Colors[theme].gray}
										/>
									</View>
								</RipplePressable>
							)
						)}
					</View>
				</PageModal>
			</View>
		</View>
	);
}
