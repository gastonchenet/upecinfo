import { Dimensions, StyleSheet } from "react-native";
import Colors from "../../../constants/Colors";

export default StyleSheet.create({
	dayProgressionLine: {
		position: "absolute",
		backgroundColor: Colors.blue,
		width: Dimensions.get("window").width,
		height: 2,
		zIndex: 100,
	},
	dayProgressionDot: {
		position: "absolute",
		backgroundColor: Colors.blue,
		width: 12,
		height: 12,
		borderRadius: 6,
		zIndex: 100,
		left: 50,
		transform: [{ translateY: -5 }, { translateX: -5.5 }],
	},
});
