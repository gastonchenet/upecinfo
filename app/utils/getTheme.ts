import { Appearance } from "react-native";
import Colors from "../constants/Colors";

export default function getTheme() {
	return Colors[Appearance.getColorScheme() ?? "light"];
}
