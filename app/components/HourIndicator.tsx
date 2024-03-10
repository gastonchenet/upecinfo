import React, { useState, useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import getTheme from "../utils/getTheme";
import moment, { type Moment } from "moment";

const PLANNING_START = 8;

type HourIndicatorProps = {
	date: Moment;
};

export default function HourIndicator({ date }: HourIndicatorProps) {
	const [time, setTime] = useState(moment());

	useEffect(() => {
		const interval = setInterval(() => setTime(moment()), 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<React.Fragment>
			<View
				style={[
					styles.dayProgressionLine,
					{
						top:
							(time.diff(date.startOf("day"), "seconds") / 3600 -
								PLANNING_START) *
							100,
					},
				]}
			/>
			<View
				style={[
					styles.dayProgressionDot,
					{
						top:
							(time.diff(date.startOf("day"), "seconds") / 3600 -
								PLANNING_START) *
							100,
					},
				]}
			/>
		</React.Fragment>
	);
}

const styles = StyleSheet.create({
	dayProgressionLine: {
		position: "absolute",
		backgroundColor: getTheme().blue,
		width: Dimensions.get("window").width,
		height: 2,
		zIndex: 100,
	},
	dayProgressionDot: {
		position: "absolute",
		backgroundColor: getTheme().blue,
		width: 12,
		height: 12,
		borderRadius: 6,
		zIndex: 100,
		left: 50,
		transform: [{ translateY: -5 }, { translateX: -5.5 }],
	},
});
