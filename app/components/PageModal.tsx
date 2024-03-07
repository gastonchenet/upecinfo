import React, { useEffect, type ReactNode } from "react";
import {
	View,
	StyleSheet,
	Dimensions,
	BackHandler,
	Appearance,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import getTheme from "../utils/getTheme";
import RipplePressable from "./RipplePressable";

type PageModalProps = {
	visible: boolean;
	children?: ReactNode;
	head: ReactNode;
	onClose?: (...args: any[]) => void;
};

const ANIMATION_DURATION = 200;

export default function PageModal({
	visible,
	children,
	head,
	onClose,
}: PageModalProps) {
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

	return (
		<Animated.ScrollView style={[styles.container, animatedStyle]}>
			<View style={styles.headContainer}>
				<RipplePressable
					duration={500}
					rippleColor={
						Appearance.getColorScheme() === "dark" ? "#fff3" : "#0001"
					}
					onPress={onClose ?? (() => {})}
					style={styles.backButton}
				>
					<MaterialIcons
						name="arrow-back"
						size={24}
						color={getTheme().darkGray}
					/>
				</RipplePressable>
				{head}
			</View>
			{children}
		</Animated.ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: getTheme().primary,
	},
	headContainer: {
		padding: 10,
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
