import { StyleSheet } from "react-native";
import Colors from "../../../constants/Colors";

const GAP = 5;

export default StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: "row",
		marginTop: 40,
		height: 100,
		gap: GAP,
	},
	barContainer: {
		height: "100%",
		gap: 2,
	},
	bar: {
		marginTop: "auto",
		borderRadius: 5,
	},
	barHead: {
		borderRadius: 5,
		height: 10,
	},
	barText: {
		fontSize: 10,
		fontFamily: "Rubik-Regular",
		textAlign: "center",
	},
});
