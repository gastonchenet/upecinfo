import React, { useEffect, type ReactNode, useState } from "react";
import { View, Dimensions, BackHandler, StatusBar } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import Colors from "../../constants/Colors";
import lightMode from "./styles/lightMode";
import darkMode from "./styles/darkMode";
import RipplePressable from "../RipplePressable";

type PageModalProps = {
	visible: boolean;
	children?: ReactNode;
	head: ReactNode;
	onClose?: (...args: any[]) => void;
	theme: "light" | "dark";
	statusBarPadding?: boolean;
};

const ANIMATION_DURATION = 200;

export default function PageModal({
	visible,
	children,
	head,
	onClose,
	theme,
	statusBarPadding,
}: PageModalProps) {
	const [styles, setStyles] = useState(theme === "dark" ? darkMode : lightMode);

	const x = useSharedValue(Dimensions.get("window").width);
	const opacity = useSharedValue(0);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: x.value }],
		opacity: opacity.value,
		pointerEvents: visible ? "auto" : "none",
	}));

	useEffect(() => {
		x.value = withTiming(visible ? 0 : Dimensions.get("window").width, {
			duration: ANIMATION_DURATION,
		});

		opacity.value = withTiming(visible ? 1 : 0, {
			duration: ANIMATION_DURATION,
		});

		function onBackPress() {
			if (visible) {
				onClose?.();
				return true;
			}

			return false;
		}

		BackHandler.addEventListener("hardwareBackPress", onBackPress);

		return () => {
			BackHandler.removeEventListener("hardwareBackPress", onBackPress);
		};
	}, [visible]);

	useEffect(() => {
		if (theme === "dark") {
			setStyles(darkMode);
		} else {
			setStyles(lightMode);
		}
	}, [theme]);

	return (
		<Animated.ScrollView
			style={[
				styles.container,
				animatedStyle,
				{
					paddingTop: statusBarPadding ? StatusBar.currentHeight : 0,
				},
			]}
		>
			<View style={styles.headContainer}>
				<RipplePressable
					duration={500}
					rippleColor={theme === "dark" ? "#fff3" : "#0001"}
					onPress={onClose ?? (() => {})}
					style={styles.backButton}
				>
					<MaterialIcons
						name="arrow-back"
						size={24}
						color={Colors[theme].darkGray}
					/>
				</RipplePressable>
				{head}
			</View>
			{children}
		</Animated.ScrollView>
	);
}
