import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Appearance } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import getTheme from "../utils/getTheme";
import RipplePressable from "./RipplePressable";
import { MaterialIcons } from "@expo/vector-icons";
import moment, { Moment } from "moment";
import OutsidePressHandler from "react-native-outside-press";

type CalendarOptions = {
	selectedDate: Moment;
	setSelectedDate: (date: Moment) => void;
	visible: boolean;
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
	selectedDate,
	setSelectedDate,
	visible,
	setVisible,
}: CalendarOptions) {
	const [currentMonth, setCurrentMonth] = useState(selectedDate);

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
			{/* <OutsidePressHandler onOutsidePress={dismissCalendar}> */}
			<View style={styles.calendarHead}>
				<View style={styles.calendarLabel}>
					<RipplePressable
						rippleColor="#0001"
						duration={500}
						onPress={selectCurrentDate}
					>
						<MaterialIcons name="today" size={24} color={getTheme().header} />
					</RipplePressable>
					<Text style={styles.calendarDay}>
						{currentMonth.format("MMMM YYYY")}
					</Text>
				</View>
				<View style={styles.calendarButtons}>
					<RipplePressable
						rippleColor="#0001"
						duration={500}
						onPress={subtractMonth}
						style={styles.calendarButton}
					>
						<MaterialIcons
							name="keyboard-arrow-left"
							size={24}
							color={getTheme().header}
						/>
					</RipplePressable>
					<RipplePressable
						rippleColor="#0001"
						duration={500}
						onPress={addMonth}
						style={styles.calendarButton}
					>
						<MaterialIcons
							name="keyboard-arrow-right"
							size={24}
							color={getTheme().header}
						/>
					</RipplePressable>
				</View>
			</View>
			<View style={styles.dayWrapper}>
				{Array.from(
					{
						length: monthDays(currentMonth.year(), currentMonth.month()),
					},
					(_, i) => (
						<RipplePressable
							key={i}
							rippleColor="#0001"
							duration={500}
							style={[
								styles.dayButton,
								{
									backgroundColor: currentMonth
										.date(i + 1)
										.isSame(selectedDate, "day")
										? Appearance.getColorScheme() === "light"
											? "#0001"
											: "#fff1"
										: "transparent",
								},
							]}
							onPress={() => selectDate(currentMonth.clone().date(i + 1))}
						>
							<Text style={styles.dayLabel}>{i + 1}</Text>
						</RipplePressable>
					)
				)}
			</View>
			{/* </OutsidePressHandler> */}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	calendar: {
		position: "absolute",
		backgroundColor: getTheme().eventColor,
		top: 50,
		right: 0,
		width: 260,
		zIndex: 100,
		borderRadius: 10,
		elevation: 5,
		shadowColor: getTheme().black,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		padding: 10,
	},
	calendarHead: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingLeft: 5,
		marginBottom: 10,
	},
	calendarLabel: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	calendarDay: {
		fontSize: 18,
		fontWeight: "700",
		color: getTheme().header,
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
	},
});
