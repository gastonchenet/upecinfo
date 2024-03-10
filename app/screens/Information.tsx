import React, { useEffect, useState } from "react";
import {
	StyleSheet,
	View,
	Text,
	ScrollView,
	Image,
	Linking,
	Dimensions,
	Appearance,
	Pressable,
} from "react-native";
import { MaterialIcons, FontAwesome6 } from "@expo/vector-icons";
import moment, { Moment } from "moment";
import "moment/locale/fr";
import RipplePressable from "../components/RipplePressable";
import PageModal from "../components/PageModal";
import getTheme from "../utils/getTheme";
import Hyperlink from "react-native-hyperlink";
import { getItemAsync, setItemAsync } from "expo-secure-store";
import { Message } from "../types/Message";
import fetchMessages from "../utils/fetchMessages";

type InformationProps = {
	setImage: (image: { url: string; height: number; width: number }) => void;
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

export default function Information({ setImage }: InformationProps) {
	const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
	const [lastSeen, setLastSeen] = useState<Moment | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);

	function selectMessage(message: Message | null) {
		setSelectedMessage(message);

		if (message && (!lastSeen || moment(message.timestamp).isAfter(lastSeen))) {
			setLastSeen(moment(message.timestamp));
			setItemAsync("last_checked", message.timestamp);
		}
	}

	useEffect(() => {
		fetchMessages().then((data) => setMessages(data));

		getItemAsync("last_checked").then((data) => {
			if (!data) return;
			setLastSeen(moment(data));
		});
	}, []);

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
							rippleColor={
								Appearance.getColorScheme() === "dark" ? "#fff1" : "#0001"
							}
							onPress={() => selectMessage(message)}
						>
							<Image
								source={
									message.author_avatar
										? { uri: message.author_avatar }
										: require("../assets/images/icon.png")
								}
								style={styles.messageAvatar}
							/>
							<View style={styles.messageElement}>
								<View style={styles.messageElementHead}>
									{moment(message.timestamp).isAfter(lastSeen) && (
										<MaterialIcons
											name="circle"
											size={8}
											color={getTheme().accent}
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
											color={getTheme().darkGray}
										/>
										<Text
											style={styles.attachmentsText}
											numberOfLines={3}
											ellipsizeMode="tail"
										>
											{message.attachments.length > 1
												? `${message.attachments.length} pièces jointes`
												: `${message.attachments[0].filename}`}
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
					head={
						<View style={styles.messageHead}>
							<Image
								source={
									selectedMessage?.author_avatar
										? { uri: selectedMessage?.author_avatar }
										: require("../assets/images/icon.png")
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
										borderLeftColor: embed.themeColor || getTheme().accent,
									},
								]}
								duration={500}
								rippleColor={
									Appearance.getColorScheme() === "dark" ? "#fff1" : "#0001"
								}
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
									rippleColor={
										Appearance.getColorScheme() === "dark" ? "#fff1" : "#0001"
									}
								>
									<View style={styles.attachmentIcon}>
										{attachment.type.startsWith("application/pdf") ? (
											<FontAwesome6
												name="file-pdf"
												size={20}
												color={getTheme().accent}
											/>
										) : attachment.type.startsWith("application/msword") ? (
											<FontAwesome6
												name="file-word"
												size={20}
												color={getTheme().accent}
											/>
										) : (
											<FontAwesome6
												name="file"
												size={20}
												color={getTheme().accent}
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
											color={getTheme().gray}
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

const styles = StyleSheet.create({
	page: {
		flex: 1,
		width: Dimensions.get("window").width,
	},
	subHead: {
		paddingHorizontal: 15,
		height: 45,
		backgroundColor: getTheme().accentDark,
		alignItems: "center",
		justifyContent: "space-between",
		flexDirection: "row",
	},
	subHeadDay: {
		textTransform: "capitalize",
		color: getTheme().white,
		fontSize: 16,
		fontFamily: "Rubik-Bold",
	},
	messagesContainer: {
		flex: 1,
	},
	attachmentIcon: {
		width: 30,
		height: 30,
		justifyContent: "center",
		alignItems: "center",
	},
	attachmentFile: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: getTheme().planningColor,
		padding: 15,
		gap: 10,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: getTheme().borderColor,
	},
	attachmentInfo: {
		flex: 1,
		gap: 2,
	},
	attachmentFilename: {
		fontFamily: "Rubik-Regular",
		color: getTheme().darkGray,
		flex: 1,
	},
	attachmentSize: {
		fontFamily: "Rubik-Regular",
		color: getTheme().lightGray,
		fontSize: 12,
	},
	messageAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
	},
	messageUsername: {
		fontFamily: "Rubik-Bold",
		color: getTheme().header,
	},
	message: {
		flexDirection: "row",
		gap: 20,
	},
	attachmentImage: {
		width: "100%",
		height: 200,
		borderRadius: 10,
	},
	attachments: {
		padding: 15,
		gap: 15,
	},
	embeds: {
		padding: 15,
		gap: 15,
	},
	embed: {
		flexDirection: "row",
		gap: 15,
		backgroundColor: getTheme().planningColor,
		padding: 15,
		borderRadius: 10,
		borderLeftWidth: 5,
	},
	embedThumbnail: {
		width: 100,
		height: 100,
		borderRadius: 10,
	},
	embedInfo: {
		flex: 1,
	},
	embedTitle: {
		fontFamily: "Rubik-Bold",
		color: getTheme().blue,
	},
	embedDescription: {
		fontFamily: "Rubik-Regular",
		color: getTheme().gray,
	},
	messageContent: {
		fontFamily: "Rubik-Regular",
		fontSize: 15,
		lineHeight: 24,
		color: getTheme().header,
	},
	messageContainer: {
		marginHorizontal: 15,
		paddingVertical: 25,
		borderTopColor: getTheme().borderColor,
	},
	messageDate: {
		fontFamily: "Rubik-Regular",
		fontSize: 12,
		color: getTheme().gray,
		textTransform: "capitalize",
	},
	messageAuthor: {
		fontFamily: "Rubik-Bold",
		fontSize: 16,
		color: getTheme().header,
	},
	authorAvatar: {
		height: 40,
		width: 40,
		borderRadius: 20,
	},
	messageHead: {
		flexDirection: "row",
		gap: 15,
		alignItems: "center",
	},
	messagePreview: {
		fontFamily: "Rubik-Regular",
		fontSize: 12,
		color: getTheme().gray,
		flex: 1,
		lineHeight: 20,
	},
	messageTimestamp: {
		fontFamily: "Rubik-Regular",
		fontSize: 10,
		color: getTheme().lightGray,
	},
	messageElement: {
		flex: 1,
	},
	messageButton: {
		gap: 15,
		padding: 20,
		borderTopColor: getTheme().borderColor,
		flexDirection: "row",
	},
	messageElementHead: {
		flexDirection: "row",
		gap: 5,
		alignItems: "center",
	},
	linkStyle: {
		color: getTheme().blue,
	},
	attachmentsRow: {
		flexDirection: "row",
		gap: 5,
		alignItems: "center",
	},
	attachmentsText: {
		fontFamily: "Rubik-Regular",
		color: getTheme().darkGray,
		fontSize: 12,
	},
});
