import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import moment, { type Moment } from "moment";
import Colors from "../../constants/Colors";
import darkMode from "./styles/darkMode";
import lightMode from "./styles/lightMode";
import type { Planning } from "../../types/Planning";
import OutsidePressHandler from "react-native-outside-press";

type CalendarProps = {
	planningData: Planning;
	selectedDate: Moment;
	visible: boolean;
	setSelectedDate: (date: Moment) => void;
	setVisible: (visible: boolean) => void;
	theme: "light" | "dark";
};

const ANIMATION_DURATION = 150;

export default function Calendar({
	planningData,
	selectedDate,
	visible,
	setSelectedDate,
	setVisible,
	theme,
}: CalendarProps) {
	const [styles, setStyles] = useState(theme === "dark" ? darkMode : lightMode);

	const [currentMonth, setCurrentMonth] = useState(
		selectedDate.clone().startOf("month")
	);

	const calendarOpacity = useSharedValue(0);
	const calendarY = useSharedValue(-20);

	const calendarAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: calendarY.value }],
		opacity: calendarOpacity.value,
		pointerEvents: visible ? "auto" : "none",
	}));

	useEffect(() => {
		calendarOpacity.value = withTiming(visible ? 1 : 0, {
			duration: ANIMATION_DURATION,
		});

		calendarY.value = withTiming(visible ? 0 : -20, {
			duration: ANIMATION_DURATION,
		});
	}, [visible]);

	useEffect(() => {
		if (theme === "dark") {
			setStyles(darkMode);
		} else {
			setStyles(lightMode);
		}
	}, [theme]);

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
		setCurrentMonth(currentMonth.clone().add(1, "month"));
	}

	function subtractMonth() {
		setCurrentMonth(currentMonth.clone().subtract(1, "month"));
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
			<OutsidePressHandler onOutsidePress={dismissCalendar}>
				<View style={styles.calendarHead}>
					<View style={styles.calendarLabel}>
						<Pressable
							onPress={selectCurrentDate}
							style={styles.currentDateButton}
						>
							<MaterialIcons
								name="today"
								size={24}
								color={Colors[theme].header}
							/>
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
								color={Colors[theme].header}
							/>
						</Pressable>
						<Pressable onPress={addMonth} style={styles.calendarButton}>
							<MaterialIcons
								name="keyboard-arrow-right"
								size={24}
								color={Colors[theme].header}
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
							currentMonth
								.clone()
								.startOf("month")
								.startOf("week")
								.add(i, "days")
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
											? Colors.accent
											: date.isSame(selectedDate, "day")
											? theme === "light"
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
												? Colors.white
												: planningData[date.format("YYYY-MM-DD")]
												? Colors[theme].darkGray
												: Colors[theme].lightGray,
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
												? Colors.white80
												: Colors[theme].gray,
										},
									]}
								>
									{date.format("dd")}
								</Text>
							</Pressable>
						)
					)}
				</View>
			</OutsidePressHandler>
		</Animated.View>
	);
}
