import { StyleSheet } from "react-native";
import Colors from "../../../constants/Colors";

export default StyleSheet.create({
	container: {
		position: "absolute",
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: Colors.light.primary,
		zIndex: 100,
	},
	headContainer: {
		paddingHorizontal: 10,
		paddingVertical: 20,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	backButton: {
		height: 50,
		width: 50,
		borderRadius: 25,
		justifyContent: "center",
		alignItems: "center",
	},
});
