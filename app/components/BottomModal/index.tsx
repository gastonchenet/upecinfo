import React, { useEffect, type ReactNode, useState } from "react";
import { View, Text, Pressable, BackHandler } from "react-native";
import OutsidePressHandler from "react-native-outside-press";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import darkMode from "./styles/darkMode";
import lightMode from "./styles/lightMode";

type BottomModalProps = {
	visible: boolean;
	title: string | null;
	children?: ReactNode;
	contentStyle?: any;
	boxStyle?: any;
	theme: "light" | "dark";
} & (
	| {
			canBeClosed?: true;
			onClose: (...args: any[]) => void;
	  }
	| {
			canBeClosed?: false;
			onClose?: never;
	  }
);

const ANIMATION_DURATION = 200;

export default function BottomModal({
	visible,
	onClose,
	title,
	children,
	canBeClosed = true,
	contentStyle,
	boxStyle,
	theme,
}: BottomModalProps) {
	const [styles, setStyles] = useState(theme === "dark" ? darkMode : lightMode);

	const containerOpacity = useSharedValue(0);
	const opacity = useSharedValue(0);
	const translateY = useSharedValue(200);
	const scale = useSharedValue(0.5);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }, { scale: scale.value }],
		opacity: opacity.value,
		pointerEvents: visible ? "auto" : "none",
	}));

	const containerStyle = useAnimatedStyle(() => ({
		opacity: containerOpacity.value,
		pointerEvents: visible ? "auto" : "none",
	}));

	useEffect(() => {
		containerOpacity.value = withTiming(visible ? 1 : 0, {
			duration: ANIMATION_DURATION,
		});

		opacity.value = withTiming(visible ? 1 : 0, {
			duration: ANIMATION_DURATION,
		});

		translateY.value = withTiming(visible ? 0 : 200, {
			duration: ANIMATION_DURATION,
		});

		scale.value = withTiming(visible ? 1 : 0.5, {
			duration: ANIMATION_DURATION,
		});

		function onBackPress() {
			if (visible && canBeClosed) {
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
		<Animated.View style={[styles.modalContainer, containerStyle]}>
			<Animated.View style={[styles.container, animatedStyle, boxStyle]}>
				<OutsidePressHandler onOutsidePress={onClose ?? (() => {})}>
					<View style={styles.modalHead}>
						<Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
							{title}
						</Text>
						{canBeClosed && (
							<Pressable onPress={onClose}>
								<MaterialIcons
									name="close"
									size={24}
									color={Colors[theme].header80}
								/>
							</Pressable>
						)}
					</View>
					<View style={contentStyle}>{children}</View>
				</OutsidePressHandler>
			</Animated.View>
		</Animated.View>
	);
}
