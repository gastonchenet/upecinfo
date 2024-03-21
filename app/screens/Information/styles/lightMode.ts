import { StyleSheet, Dimensions } from "react-native";
import Colors from "../../../constants/Colors";

export default StyleSheet.create({
	page: {
		flex: 1,
		width: Dimensions.get("window").width,
		backgroundColor: Colors.light.primary,
	},
	subHead: {
		paddingHorizontal: 15,
		height: 45,
		backgroundColor: Colors.accentDark,
		alignItems: "center",
		justifyContent: "space-between",
		flexDirection: "row",
	},
	subHeadDay: {
		textTransform: "capitalize",
		color: Colors.white,
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
		backgroundColor: Colors.light.planningColor,
		padding: 15,
		gap: 10,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: Colors.light.borderColor,
	},
	attachmentInfo: {
		flex: 1,
		gap: 2,
	},
	attachmentFilename: {
		fontFamily: "Rubik-Regular",
		color: Colors.light.darkGray,
		flex: 1,
	},
	attachmentSize: {
		fontFamily: "Rubik-Regular",
		color: Colors.light.lightGray,
		fontSize: 12,
	},
	messageAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
	},
	messageUsername: {
		fontFamily: "Rubik-Bold",
		color: Colors.light.header,
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
		backgroundColor: Colors.light.planningColor,
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
		color: Colors.blue,
	},
	embedDescription: {
		fontFamily: "Rubik-Regular",
		color: Colors.light.gray,
	},
	messageContent: {
		fontFamily: "Rubik-Regular",
		fontSize: 15,
		lineHeight: 24,
		color: Colors.light.header,
	},
	messageContainer: {
		marginHorizontal: 15,
		paddingVertical: 25,
		borderTopColor: Colors.light.borderColor,
	},
	messageDate: {
		fontFamily: "Rubik-Regular",
		fontSize: 12,
		color: Colors.light.gray,
		textTransform: "capitalize",
	},
	messageAuthor: {
		fontFamily: "Rubik-Bold",
		fontSize: 16,
		color: Colors.light.header,
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
		color: Colors.light.gray,
		flex: 1,
		lineHeight: 20,
	},
	messageTimestamp: {
		fontFamily: "Rubik-Regular",
		fontSize: 10,
		color: Colors.light.lightGray,
	},
	messageElement: {
		flex: 1,
	},
	messageButton: {
		gap: 15,
		padding: 20,
		borderTopColor: Colors.light.borderColor,
		flexDirection: "row",
	},
	messageElementHead: {
		flexDirection: "row",
		gap: 5,
		alignItems: "center",
	},
	linkStyle: {
		color: Colors.blue,
	},
	attachmentsRow: {
		flexDirection: "row",
		gap: 5,
		alignItems: "center",
	},
	attachmentsText: {
		fontFamily: "Rubik-Regular",
		color: Colors.light.darkGray,
		fontSize: 12,
	},
});
