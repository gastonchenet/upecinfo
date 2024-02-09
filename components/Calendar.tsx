import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Appearance, Pressable } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import getTheme from "../utils/getTheme";
import { MaterialIcons } from "@expo/vector-icons";
import moment, { type Moment } from "moment";
import type { Planning } from "../types/Planning";

type CalendarOptions = {
	planningData: Planning;
	selectedDate: Moment;
	visible: boolean;
	setSelectedDate: (date: Moment) => void;
	setVisible: (visible: boolean) => void;
};

const ANIMATION_DURATION = 200;
const MONTHS = Object.freeze([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);

function monthDays(year: number, month: number) {
	return month === 1 && year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
		? 29
		: MONTHS[month];
}

export default function Calendar({
	planningData,
	selectedDate,
	visible,
	setSelectedDate,
	setVisible,
}: CalendarOptions) {
	const [currentMonth, setCurrentMonth] = useState(
		selectedDate.clone().startOf("month")
	);

	const calendarOpacity = useSharedValue(0);
	const calendarY = useSharedValue(-50);

	const calendarAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: calendarY.value }],
		opacity: calendarOpacity.value,
		pointerEvents: visible ? "auto" : "none",
	}));

	useEffect(() => {
		calendarOpacity.value = withTiming(visible ? 1 : 0, {
			duration: ANIMATION_DURATION,
		});

		calendarY.value = withTiming(visible ? 0 : -50, {
			duration: ANIMATION_DURATION,
		});
	}, [visible]);

	function dismissCalendar() {
		setVisible(false);
	}

	function selectCurrentDate() {
		setSelectedDate(moment());
		dismissCalendar();
	}

	function selectDate(date: Moment) {
		setSelectedDate(date);
		dismissCalendar();
	}

	function addMonth() {
		setCurrentMonth(currentMonth.add(1, "month").clone());
	}

	function subtractMonth() {
		setCurrentMonth(currentMonth.subtract(1, "month").clone());
	}

	return (
		<Animated.View style={[styles.calendar, calendarAnimatedStyle]}>
			<View style={styles.calendarHead}>
				<View style={styles.calendarLabel}>
					<Pressable
						onPress={selectCurrentDate}
						style={styles.currentDateButton}
					>
						<MaterialIcons name="today" size={24} color={getTheme().header} />
					</Pressable>
					<Text style={styles.calendarDay}>
						{currentMonth.format("MMMM YYYY")}
					</Text>
				</View>
				<View style={styles.calendarButtons}>
					<Pressable onPress={subtractMonth} style={styles.calendarButton}>
						<MaterialIcons
							name="keyboard-arrow-left"
							size={24}
							color={getTheme().header}
						/>
					</Pressable>
					<Pressable onPress={addMonth} style={styles.calendarButton}>
						<MaterialIcons
							name="keyboard-arrow-right"
							size={24}
							color={getTheme().header}
						/>
					</Pressable>
				</View>
			</View>
			<View style={styles.dayWrapper}>
				{Array.from(
					{ length: monthDays(currentMonth.year(), currentMonth.month()) },
					(_, i) => (
						<Pressable
							key={i}
							style={[
								styles.dayButton,
								{
									backgroundColor: currentMonth
										.date(i + 1)
										.isSame(moment(), "day")
										? getTheme().accent
										: currentMonth.date(i + 1).isSame(selectedDate, "day")
										? Appearance.getColorScheme() === "light"
											? "#0001"
											: "#fff1"
										: "transparent",
								},
							]}
							onPress={() => selectDate(currentMonth.clone().date(i + 1))}
						>
							<Text
								style={[
									styles.dayLabel,
									{
										color: currentMonth.date(i + 1).isSame(moment(), "day")
											? getTheme().white
											: planningData[
													currentMonth
														.clone()
														.date(i + 1)
														.format("YYYY-MM-DD")
											  ]
											? getTheme().darkGray
											: getTheme().lightGray,
									},
								]}
							>
								{i + 1}
							</Text>
						</Pressable>
					)
				)}
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	calendar: {
		position: "absolute",
		backgroundColor: getTheme().eventColor,
		top: 56,
		right: 0,
		width: 260,
		zIndex: 100,
		borderRadius: 10,
		elevation: 5,
		shadowColor: getTheme().black,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		padding: 10,
		marginRight: 10,
	},
	calendarHead: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 10,
	},
	calendarLabel: {
		flexDirection: "row",
		alignItems: "center",
	},
	calendarDay: {
		fontSize: 16,
		color: getTheme().header,
		fontFamily: "Rubik-Bold",
	},
	calendarButtons: {
		flexDirection: "row",
		alignItems: "center",
		gap: 5,
	},
	calendarButton: {
		height: 30,
		width: 30,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 15,
	},
	dayWrapper: {
		flex: 1,
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 5,
	},
	dayButton: {
		width: 30,
		height: 30,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 15,
	},
	dayLabel: {
		fontSize: 16,
		color: getTheme().darkGray,
		fontFamily: "Rubik-Regular",
	},
	currentDateButton: {
		height: 40,
		width: 40,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 20,
	},
});
