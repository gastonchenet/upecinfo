import React, { useState, useEffect } from "react";
import { View } from "react-native";
import moment, { type Moment } from "moment";
import darkMode from "./styles/darkMode";
import lightMode from "./styles/lightMode";

const PLANNING_START = 8;

type HourIndicatorProps = {
	date: Moment;
	theme: "light" | "dark";
};

export default function HourIndicator({ date, theme }: HourIndicatorProps) {
	const [styles, setStyles] = useState(theme === "dark" ? darkMode : lightMode);
	const [time, setTime] = useState(moment());

	useEffect(() => {
		const interval = setInterval(() => setTime(moment()), 1000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (theme === "dark") {
			setStyles(darkMode);
		} else {
			setStyles(lightMode);
		}
	}, [theme]);

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
