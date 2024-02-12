import React, { useEffect, type ReactNode } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import getTheme from "../utils/getTheme";

type BottomModalProps = {
	visible: boolean;
	setVisible: (visible: boolean) => void;
	title: string;
	children: ReactNode;
};

const ANIMATION_DURATION = 200;

export default function BottomModal({
	visible,
	setVisible,
	title,
	children,
}: BottomModalProps) {
	const opacity = useSharedValue(0);
	const translateY = useSharedValue(200);
	const scale = useSharedValue(0.5);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateY: translateY.value }, { scale: scale.value }],
			opacity: opacity.value,
			pointerEvents: visible ? "auto" : "none",
		};
	});

	function close() {
		setVisible(false);
	}

	useEffect(() => {
		opacity.value = withTiming(visible ? 1 : 0, {
			duration: ANIMATION_DURATION,
		});

		translateY.value = withTiming(visible ? 0 : 200, {
			duration: ANIMATION_DURATION,
		});

		scale.value = withTiming(visible ? 1 : 0.5, {
			duration: ANIMATION_DURATION,
		});
	}, [visible]);

	return (
		<Animated.View style={[styles.container, animatedStyle]}>
			<View style={styles.modalHead}>
				<Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
					{title}
				</Text>
				<Pressable onPress={close}>
					<MaterialIcons name="close" size={24} color={getTheme().header80} />
				</Pressable>
			</View>
			<View>{children}</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "white",
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
		color: getTheme().header,
		fontFamily: "Rubik-Bold",
		flex: 1,
	},
});
