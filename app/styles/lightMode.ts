import { StyleSheet, StatusBar } from "react-native";
import Colors from "../constants/Colors";

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.light.primary,
	},
	head: {
		alignItems: "center",
		flexDirection: "row",
		paddingTop: StatusBar.currentHeight!,
		paddingHorizontal: 15,
		paddingBottom: 5,
		backgroundColor: Colors.accent,
		gap: 15,
	},
	appIcon: {
		width: 50,
		height: 32,
		marginBottom: 8,
	},
	headText: {
		justifyContent: "center",
		marginBottom: 8,
	},
	appTitle: {
		color: Colors.white,
		fontSize: 22,
		fontFamily: "Rubik-ExtraBold",
		lineHeight: 28,
	},
	appDescription: {
		color: Colors.white80,
		fontWeight: "400",
		fontSize: 12,
		fontFamily: "Rubik-Regular",
		lineHeight: 18,
	},
	modalButtons: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 20,
	},
	modalDescription: {
		fontFamily: "Rubik-Regular",
		color: Colors.light.gray,
		fontSize: 14,
	},
	modalButton: {
		backgroundColor: Colors.light.borderColor,
		padding: 15,
		borderRadius: 10,
		flex: 1,
		marginTop: 15,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
	},
	modalButtonText: {
		fontFamily: "Rubik-Regular",
		color: Colors.light.header80,
		textAlign: "center",
	},
	modalButtonDanger: {
		backgroundColor: Colors.red,
	},
	modalButtonDangerText: {
		color: Colors.white,
	},
	dateText: {
		marginTop: 15,
		color: Colors.light.lightGray,
		fontSize: 12,
		fontFamily: "Rubik-Regular",
		textTransform: "capitalize",
	},
	evalItem: {
		fontFamily: "Rubik-Regular",
		color: Colors.light.header,
	},
	evalItemLabel: {
		fontFamily: "Rubik-Bold",
		color: Colors.light.gray,
		fontSize: 12,
		textTransform: "uppercase",
	},
	promoSelectorContainer: {
		gap: 15,
		paddingVertical: 15,
	},
	promoSelector: {
		borderWidth: 2,
		borderColor: Colors.light.gray,
		borderRadius: 10,
		padding: 10,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 10,
	},
	promoText: {
		fontFamily: "Rubik-Regular",
		color: Colors.light.header,
		fontSize: 13,
		marginLeft: 5,
	},
	arrowButtonActivityContainer: {
		height: 30,
		width: 30,
		justifyContent: "center",
		alignItems: "center",
	},
	arrowButtonContainer: {
		height: 30,
		width: 30,
		backgroundColor: Colors.light.darkGray,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 15,
	},
	planningChangeContent: {
		maxHeight: 380,
	},
	planningChangeBottomModal: {
		paddingBottom: 0,
	},
	settingButtonDescription: {
		fontFamily: "Rubik-Regular",
		color: Colors.light.lightGray,
		fontSize: 12,
		marginTop: 2,
	},
	graphLoader: {
		marginTop: 40,
	},
	headButtons: {
		marginLeft: "auto",
		flexDirection: "row",
		gap: 10,
	},
	headButton: {
		height: 40,
		width: 40,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 20,
	},
	pageModalTitle: {
		fontFamily: "Rubik-Bold",
		fontSize: 16,
		color: Colors.light.header,
	},
	pageModalSubtitle: {
		fontFamily: "Rubik-Regular",
		fontSize: 12,
		color: Colors.light.gray,
	},
	notification: {
		backgroundColor: Colors.light.secondary,
		borderRadius: 10,
		padding: 15,
		marginBottom: 15,
		marginHorizontal: 15,
		flexDirection: "row",
		alignItems: "center",
		gap: 15,
	},
	notificationTitle: {
		fontFamily: "Rubik-Bold",
		color: Colors.light.header,
		fontSize: 14,
		flex: 1,
	},
	notificationBody: {
		fontFamily: "Rubik-Regular",
		color: Colors.light.darkGray,
		fontSize: 12,
		lineHeight: 18,
		marginTop: 2,
	},
	notificationDate: {
		fontFamily: "Rubik-Regular",
		color: Colors.light.lightGray,
		fontSize: 10,
	},
	flexBox: {
		flex: 1,
	},
	notifHead: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 2,
	},
});
