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
	settingItem: {
		flexDirection: "row",
		alignItems: "flex-start",
		paddingHorizontal: 15,
		gap: 10,
		marginVertical: 12,
	},
	settingItemTitle: {
		fontFamily: "Rubik-Regular",
		color: Colors.light.header,
	},
	settingItemTextContainer: {
		flex: 1,
		flexDirection: "column",
		gap: 4,
	},
	settingItemDescription: {
		fontFamily: "Rubik-Regular",
		fontSize: 12,
		color: Colors.light.lightGray,
		lineHeight: 19,
	},
	settingItemSwitch: {
		marginLeft: "auto",
		marginTop: -12,
		marginBottom: -30,
	},
	settingCategoryTitle: {
		fontFamily: "Rubik-Bold",
		fontSize: 18,
		color: Colors.light.header,
	},
	settingCategoryTitleContainer: {
		padding: 15,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	settingCategoryTitleIcon: {
		width: 20,
		height: 20,
	},
	settingContainer: {
		paddingVertical: 10,
	},
	settingButton: {
		flexDirection: "row",
		gap: 5,
	},
	settingButtonTextDanger: {
		fontFamily: "Rubik-Regular",
		color: Colors.red,
	},
	settingButtonText: {
		fontFamily: "Rubik-Regular",
		color: Colors.light.header,
	},
	settingButtonIcon: {
		width: 20,
		height: 20,
	},
	settingItemValue: {
		fontFamily: "Rubik-Regular",
		fontSize: 14,
		color: Colors.light.lightGray,
		marginLeft: "auto",
	},
});
