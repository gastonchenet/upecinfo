import React, { type ReactNode } from "react";
import type { StyleSheet } from "react-native";
import {
	type GestureEvent,
	TapGestureHandler,
	type TapGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import Animated, {
	measure,
	runOnJS,
	useAnimatedGestureHandler,
	useAnimatedRef,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";

type RipplePressableProps = {
	style?: any;
	onPress?: (...args: any[]) => void;
	children: ReactNode;
	duration: number;
	rippleColor: string;
};

export default function RipplePressable({
	style,
	onPress,
	children,
	duration,
	rippleColor,
}: RipplePressableProps) {
	const centerX = useSharedValue(0);
	const centerY = useSharedValue(0);
	const scale = useSharedValue(0);

	const aRef = useAnimatedRef();
	const width = useSharedValue(0);
	const height = useSharedValue(0);

	const rippleOpacity = useSharedValue(0);

	const tapGestureEvent = useAnimatedGestureHandler({
		onStart: (tapEvent) => {
			const layout = measure(aRef)!;
			width.value = layout.width;
			height.value = layout.height;

			centerX.value = tapEvent.x;
			centerY.value = tapEvent.y;

			rippleOpacity.value = 1;
			scale.value = 0;
			scale.value = withTiming(1, { duration });
		},
		onActive: () => {
			if (onPress) runOnJS(onPress)();
		},
		onEnd: () => {
			rippleOpacity.value = withTiming(0);
		},
		onCancel: () => {
			rippleOpacity.value = withTiming(0);
		},
		onFail: () => {
			rippleOpacity.value = withTiming(0);
		},
		onFinish: () => {
			rippleOpacity.value = withTiming(0);
		},
	}) as (event: GestureEvent<TapGestureHandlerEventPayload>) => void;

	const rStyle = useAnimatedStyle(() => {
		const circleRadius = Math.sqrt(width.value ** 2 + height.value ** 2);

		const translateX = centerX.value - circleRadius;
		const translateY = centerY.value - circleRadius;

		return {
			width: circleRadius * 2,
			height: circleRadius * 2,
			borderRadius: circleRadius,
			opacity: rippleOpacity.value,
			backgroundColor: rippleColor,
			position: "absolute",
			top: 0,
			left: 0,
			pointerEvents: "box-none",
			transform: [{ translateX }, { translateY }, { scale: scale.value }],
		};
	});

	return (
		<TapGestureHandler onGestureEvent={tapGestureEvent}>
			<Animated.View style={[style, { overflow: "hidden" }]} ref={aRef}>
				{children}
				<Animated.View style={rStyle} />
			</Animated.View>
		</TapGestureHandler>
	);
}
