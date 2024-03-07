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

type CalendarProps = {
	planningData: Planning;
	selectedDate: Moment;
	visible: boolean;
	setSelectedDate: (date: Moment) => void;
	setVisible: (visible: boolean) => void;
};

const ANIMATION_DURATION = 200;

export default function Calendar({
	planningData,
	selectedDate,
	visible,
	setSelectedDate,
	setVisible,
}: CalendarProps) {
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

	function monthDays() {
		return Array.from(
			{
				length:
					currentMonth
						.clone()
						.endOf("month")
						.diff(currentMonth.clone().startOf("month"), "days") + 1,
			},
			(_, i) =>
				currentMonth
					.clone()
					.startOf("month")
					.add(i, "days")
					.format("YYYY-MM-DD")
		).reduce((acc, date) => acc + (planningData[date] ? 1 : 0), 0);
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
					<View>
						<Text style={styles.calendarDay}>
							{currentMonth.format("MMMM YYYY")}
						</Text>
						<Text style={styles.calendarSubDay}>
							{monthDays() === 0
								? "Aucun cours"
								: monthDays() === 1
								? "1 jour de cours"
								: `${monthDays()} jours de cours`}
						</Text>
					</View>
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
					{
						length:
							currentMonth
								.clone()
								.endOf("month")
								.endOf("week")
								.diff(
									currentMonth.clone().startOf("month").startOf("week"),
									"days"
								) + 1,
					},
					(_, i) =>
						currentMonth.clone().startOf("month").startOf("week").add(i, "days")
				).map((date, i) =>
					!date.isSame(currentMonth, "month") ? (
						<View key={i} style={styles.dayButton} />
					) : (
						<Pressable
							key={i}
							style={[
								styles.dayButton,
								{
									backgroundColor: date.isSame(moment(), "day")
										? getTheme().accent
										: date.isSame(selectedDate, "day")
										? Appearance.getColorScheme() === "light"
											? "#0001"
											: "#fff1"
										: "transparent",
								},
							]}
							onPress={() => selectDate(date)}
						>
							<Text
								style={[
									styles.dayLabel,
									{
										color: date.isSame(moment(), "day")
											? getTheme().white
											: planningData[date.format("YYYY-MM-DD")]
											? getTheme().darkGray
											: getTheme().lightGray,
									},
								]}
							>
								{date.format("D")}
							</Text>
							<Text
								style={[
									styles.dayName,
									{
										color: date.isSame(moment(), "day")
											? getTheme().white80
											: getTheme().gray,
									},
								]}
							>
								{date.format("dd")}
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
		width: 330,
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
		lineHeight: 20,
		color: getTheme().header,
		fontFamily: "Rubik-Bold",
		textTransform: "capitalize",
	},
	calendarSubDay: {
		fontSize: 12,
		lineHeight: 16,
		color: getTheme().gray,
		fontFamily: "Rubik-Italic",
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
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 20,
	},
	dayLabel: {
		fontSize: 16,
		lineHeight: 16,
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
	dayName: {
		fontSize: 10,
		lineHeight: 10,
		color: getTheme().gray,
		fontFamily: "Rubik-Regular",
		textTransform: "capitalize",
	},
});
