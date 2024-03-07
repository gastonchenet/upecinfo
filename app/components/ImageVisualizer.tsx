import React, { useEffect } from "react";
import {
	Image,
	StyleSheet,
	Pressable,
	Dimensions,
	StatusBar,
	BackHandler,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import RipplePressable from "./RipplePressable";
import { MaterialIcons } from "@expo/vector-icons";

type ImageVisualizerProps = {
	image: { url: string; height: number; width: number } | null;
	padding: number;
	onClose?: (...args: any[]) => void;
};

const ANIMATION_DURATION = 200;

function scaleFromImageSize(
	image: { height: number; width: number },
	padding: number
) {
	const { width, height } = Dimensions.get("window");
	const scale = Math.min(
		(width - padding * 2) / image.width,
		(height - padding * 2) / image.height
	);
	return scale;
}

export default function ImageVisualizer({
	image,
	onClose,
	padding,
}: ImageVisualizerProps) {
	const opacity = useSharedValue(0);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
		pointerEvents: image ? "auto" : "none",
	}));

	useEffect(() => {
		opacity.value = withTiming(image ? 1 : 0, { duration: ANIMATION_DURATION });

		function onBackPress() {
			if (image) {
				onClose?.();
				return true;
			}

			return false;
		}

		BackHandler.addEventListener("hardwareBackPress", onBackPress);

		return () => {
			BackHandler.removeEventListener("hardwareBackPress", onBackPress);
		};
	}, [image]);

	return (
		<Animated.View style={[styles.modalContainer, animatedStyle]}>
			<RipplePressable
				onPress={onClose ?? (() => {})}
				style={styles.closeButton}
				rippleColor="#fff3"
				duration={500}
			>
				<MaterialIcons name="close" size={24} color="#fff" />
			</RipplePressable>
			<Pressable style={styles.imageContainer} onPress={onClose ?? (() => {})}>
				{image && (
					<Image
						source={{ uri: image.url }}
						style={[
							styles.image,
							{
								width: image.width * scaleFromImageSize(image, padding),
								height: image.height * scaleFromImageSize(image, padding),
							},
						]}
					/>
				)}
			</Pressable>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	modalContainer: {
		position: "absolute",
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: "#000c",
		zIndex: 800,
		justifyContent: "center",
		alignItems: "center",
	},
	imageContainer: {
		width: "100%",
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	closeButton: {
		position: "absolute",
		top: StatusBar.currentHeight!,
		right: 15,
		zIndex: 1000,
		height: 40,
		width: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
	},
	image: {
		borderRadius: 10,
	},
});
