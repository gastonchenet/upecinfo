import { StyleSheet } from "react-native";
import Colors from "../../../constants/Colors";

export default StyleSheet.create({
	calendar: {
		position: "absolute",
		backgroundColor: Colors.light.eventColor,
		top: 56,
		right: 0,
		width: 330,
		zIndex: 100,
		borderRadius: 10,
		elevation: 5,
		shadowColor: Colors.black,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		padding: 10,
		marginRight: 10,
	},
	calendarHead: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 10,
	},
	calendarLabel: {
		flexDirection: "row",
		alignItems: "center",
	},
	calendarDay: {
		fontSize: 16,
		lineHeight: 20,
		color: Colors.light.header,
		fontFamily: "Rubik-Bold",
		textTransform: "capitalize",
	},
	calendarSubDay: {
		fontSize: 12,
		lineHeight: 16,
		color: Colors.light.gray,
		fontFamily: "Rubik-Italic",
	},
	calendarButtons: {
		flexDirection: "row",
		alignItems: "center",
		gap: 5,
	},
	calendarButton: {
		height: 30,
		width: 30,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 15,
	},
	dayWrapper: {
		flex: 1,
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 5,
	},
	dayButton: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 20,
	},
	dayLabel: {
		fontSize: 16,
		lineHeight: 16,
		color: Colors.light.darkGray,
		fontFamily: "Rubik-Regular",
	},
	currentDateButton: {
		height: 40,
		width: 40,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 20,
	},
	dayName: {
		fontSize: 10,
		lineHeight: 10,
		color: Colors.light.gray,
		fontFamily: "Rubik-Regular",
		textTransform: "capitalize",
	},
});
