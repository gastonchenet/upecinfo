import { StyleSheet } from "react-native";
import Colors from "../../../constants/Colors";

export default StyleSheet.create({
	modalContainer: {
		position: "absolute",
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: "#0003",
		zIndex: 800,
	},
	container: {
		backgroundColor: Colors.dark.eventColor,
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		borderTopLeftRadius: 25,
		borderTopRightRadius: 25,
		zIndex: 900,
		padding: 20,
		elevation: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -10 },
		shadowOpacity: 0.22,
	},
	modalHead: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 10,
		gap: 10,
	},
	title: {
		fontSize: 20,
		color: Colors.dark.header,
		fontFamily: "Rubik-Bold",
		flex: 1,
	},
});
