import React, { useCallback, useEffect, useState } from "react";
import {
	StyleSheet,
	View,
	Text,
	ScrollView,
	Image,
	Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import moment, { Moment } from "moment";
import "moment/locale/fr";
import getTheme from "../utils/getTheme";
import RipplePressable from "../components/RipplePressable";
import {
	MealEvent,
	Planning as PlanningType,
	PlanningEvent,
} from "../types/Planning";
import Calendar from "../components/Calendar";
import getMealEvent from "../utils/getMealEvent";
import HourIndicator from "../components/HourIndicator";
import DefaultSettings from "../constants/DefaultSettings";

enum ColorType {
	Pastel,
	Vibrant,
}

type PlanningProps = {
	calendarDeployed: boolean;
	setCalendarDeployed: (deployed: boolean) => void;
	planningData: PlanningType;
	settings: typeof DefaultSettings;
	dayEvents: PlanningEvent[];
	setDayEvents: (events: PlanningEvent[]) => void;
	mealEvent: MealEvent | null;
	setMealEvent: (event: MealEvent | null) => void;
};

const HSL_ROTAION = 360;
const MAX_COLORS = 12;
const PLANNING_START = 8;
const PLANNING_END = 20;

function stringToColor(str: string, type: ColorType, variation: number = 1) {
	const hash = str.split("").reduce((acc, char) => {
		acc = (acc << 5) - acc + char.charCodeAt(0) ** variation;
		return acc & acc;
	}, 0);

	const rotation = (hash % HSL_ROTAION) * (HSL_ROTAION / MAX_COLORS);

	return `hsl(${rotation}, ${type === ColorType.Pastel ? 90 : 50}%, ${
		type === ColorType.Pastel ? 75 : 50
	}%)`;
}

function getDayBounds(dayEvents: PlanningEvent[]) {
	if (dayEvents.length === 0) return [];
	return [dayEvents[0].start, dayEvents.at(-1)!.end];
}

export default function Planning({
	calendarDeployed,
	setCalendarDeployed,
	planningData,
	settings,
	dayEvents,
	setDayEvents,
	mealEvent,
	setMealEvent,
}: PlanningProps) {
	const [selectedDate, setSelectedDate] = useState(moment());
	const [nextClassDay, setNextClassDay] = useState<Moment | null>(null);

	function changeDay(date: Moment) {
		setSelectedDate(date);

		const events = planningData[date.format("YYYY-MM-DD")] ?? [];

		setDayEvents(events);
		setMealEvent(getMealEvent(events));
	}

	useEffect(() => {
		if (Object.keys(planningData).length !== 0) {
			const nextDay = selectedDate.clone();

			while (!planningData[nextDay.format("YYYY-MM-DD")]) {
				nextDay.add(1, "day");
			}

			setNextClassDay(nextDay);
		}
	}, [planningData, selectedDate]);

	return (
		<View style={styles.page}>
			<View style={styles.subHead}>
				<View style={styles.subHeadDayInfo}>
					<Text style={styles.subHeadDay}>
						{selectedDate.isSame(moment(), "day")
							? "aujourd'hui"
							: selectedDate.isSame(moment().add(1, "day"), "day")
							? "demain"
							: selectedDate.isSame(moment().subtract(1, "day"), "day")
							? "hier"
							: selectedDate.format("ddd DD MMMM")}
					</Text>
					{dayEvents.length > 0 ? (
						<Text style={styles.subHeadDayBounds}>
							(
							{getDayBounds(dayEvents)
								.map((d) => moment(d).format("HH[h]mm"))
								.join(" - ")}
							)
						</Text>
					) : (
						<Text style={styles.subHeadDayBounds}>Aucun cours</Text>
					)}
				</View>
				<View style={styles.subHeadDayInfo}>
					<RipplePressable
						duration={500}
						rippleColor="#0001"
						style={styles.subHeadButton}
						onPress={() => changeDay(selectedDate.clone().subtract(1, "day"))}
					>
						<MaterialIcons name="keyboard-arrow-left" size={24} color="white" />
					</RipplePressable>
					<RipplePressable
						duration={500}
						rippleColor="#0001"
						style={styles.subHeadButton}
						onPress={() => setCalendarDeployed(!calendarDeployed)}
					>
						<MaterialIcons name="edit-calendar" size={20} color="white" />
					</RipplePressable>
					<RipplePressable
						duration={500}
						rippleColor="#0001"
						style={styles.subHeadButton}
						onPress={() => changeDay(selectedDate.clone().add(1, "day"))}
					>
						<MaterialIcons
							name="keyboard-arrow-right"
							size={24}
							color="white"
						/>
					</RipplePressable>
				</View>
			</View>
			<Calendar
				planningData={planningData}
				selectedDate={selectedDate}
				visible={calendarDeployed}
				setSelectedDate={changeDay}
				setVisible={setCalendarDeployed}
			/>
			<ScrollView
				contentContainerStyle={styles.planningContainer}
				showsVerticalScrollIndicator={false}
			>
				<View>
					{Array.from({ length: PLANNING_END - PLANNING_START }, (_, i) => (
						<View key={i} style={styles.hourDelimitation}>
							<View style={styles.sideHourSeparator}>
								{i !== 0 && (
									<Text style={styles.hour}>{i + PLANNING_START}h00</Text>
								)}
							</View>
							<View
								style={[
									styles.hourSeparator,
									{ borderTopWidth: i === 0 ? 0 : 1 },
								]}
							/>
						</View>
					))}
				</View>
				<View style={styles.eventContainer}>
					{dayEvents.map((event, index) => (
						<View
							key={index}
							style={[
								styles.event,
								{
									top:
										(moment(event.start).diff(
											selectedDate.clone().startOf("day"),
											"minutes"
										) /
											60 -
											PLANNING_START) *
										100,
									height:
										(moment(event.end).diff(moment(event.start), "minutes") /
											60) *
										100,
									borderLeftColor: stringToColor(
										event.teacher,
										ColorType.Pastel,
										3
									),
								},
							]}
						>
							<View style={styles.eventTextContent}>
								<Text
									style={styles.title}
									ellipsizeMode="tail"
									numberOfLines={2}
								>
									{event.summary}
								</Text>
								<View style={styles.teacher}>
									<Image
										source={require("../assets/images/teacher.png")}
										style={styles.teacherIcon}
									/>
									<Text
										style={styles.teacherText}
										ellipsizeMode="tail"
										numberOfLines={1}
									>
										{event.teacher}
									</Text>
								</View>
								<Text style={styles.boundaries}>
									{moment(event.start).format("HH[h]mm")} -{" "}
									{moment(event.end).format("HH[h]mm")}
								</Text>
							</View>
							{event.location && (
								<Text style={styles.room}>
									{event.location.replace(/\\,\s*/g, ", ")}
								</Text>
							)}
						</View>
					))}
					{settings.showMealBounds && mealEvent && (
						<View
							style={[
								styles.mealTimeBox,
								{
									top:
										(mealEvent.start.diff(
											selectedDate.clone().startOf("day"),
											"minutes"
										) /
											60 -
											PLANNING_START) *
											100 +
										10,
									height:
										(mealEvent.end.diff(mealEvent.start, "minutes") / 60) *
											100 -
										20,
								},
							]}
						>
							<MaterialIcons
								name="lunch-dining"
								size={24}
								color={getTheme().yellow}
							/>
							<Text style={styles.mealTimeText}>Pause déjeuner</Text>
						</View>
					)}
					{settings.hourIndicatorEnabled && (
						<HourIndicator date={selectedDate.clone()} />
					)}
				</View>
			</ScrollView>
			{dayEvents.length === 0 && nextClassDay && (
				<View style={styles.noClassContainer}>
					<Text style={styles.noClassTitle}>Aucun cours prévu</Text>
					<Text style={styles.noClassDescription}>
						La prochaine journée de cours est prévue pour le{" "}
						{nextClassDay.format("dddd DD MMMM")},{" "}
						{nextClassDay.diff(selectedDate, "days") < 2
							? "le lendemain."
							: `dans ${nextClassDay.diff(selectedDate, "days")} jours.`}
					</Text>
					<RipplePressable
						rippleColor="#fff1"
						duration={500}
						style={styles.noClassButton}
						onPress={() => changeDay(nextClassDay)}
					>
						<MaterialIcons name="edit-calendar" size={20} color="white" />
						<Text style={styles.noClassButtonText}>
							Aller au {nextClassDay.format("dddd DD MMMM")}
						</Text>
					</RipplePressable>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	page: {
		flex: 1,
		width: Dimensions.get("window").width,
	},
	planningContainer: {
		backgroundColor: getTheme().primary,
	},
	event: {
		position: "absolute",
		backgroundColor: getTheme().eventColor,
		left: 50,
		width: Dimensions.get("window").width - 50,
		flexDirection: "row",
		justifyContent: "space-between",
		borderRadius: 6,
		borderLeftWidth: 6,
		padding: 10,
		elevation: 2,
		shadowColor: getTheme().black,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		gap: 10,
	},
	room: {
		backgroundColor: getTheme().accent,
		color: "white",
		alignSelf: "flex-start",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 5,
		fontSize: 12,
		fontFamily: "Rubik-Regular",
	},
	boundaries: {
		fontWeight: "400",
		color: getTheme().lightGray,
		fontSize: 12,
		marginTop: "auto",
		fontFamily: "Rubik-Regular",
	},
	title: {
		fontSize: 18,
		color: getTheme().header,
		fontFamily: "Rubik-Bold",
	},
	teacher: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	teacherText: {
		fontSize: 15,
		color: getTheme().teacherColor,
		fontFamily: "Rubik-Italic",
	},
	subHead: {
		paddingHorizontal: 15,
		height: 45,
		backgroundColor: getTheme().accentDark,
		alignItems: "center",
		justifyContent: "space-between",
		flexDirection: "row",
	},
	subHeadDayInfo: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	subHeadDay: {
		textTransform: "capitalize",
		color: getTheme().white,
		fontSize: 16,
		fontFamily: "Rubik-Bold",
	},
	subHeadDayBounds: {
		color: getTheme().white80,
		fontSize: 12,
		fontFamily: "Rubik-Regular",
	},
	subHeadButton: {
		borderRadius: 18,
		height: 36,
		width: 36,
		alignItems: "center",
		justifyContent: "center",
	},
	eventContainer: {
		position: "absolute",
	},
	eventTextContent: {
		flex: 1,
	},
	teacherIcon: {
		width: 20,
		height: 20,
	},
	mealTimeBox: {
		position: "absolute",
		backgroundColor: getTheme().yellowFill,
		borderColor: getTheme().yellowBorder,
		width: Dimensions.get("window").width - 50,
		left: 50,
		borderRadius: 10,
		padding: 10,
		borderWidth: 1,
		borderStyle: "dashed",
		alignItems: "center",
		justifyContent: "center",
	},
	mealTimeText: {
		color: getTheme().yellow,
		fontSize: 14,
		fontFamily: "Rubik-Italic",
	},
	hourSeparator: {
		borderLeftWidth: 1,
		borderTopColor: getTheme().borderColor,
		borderLeftColor: getTheme().borderColor,
		backgroundColor: getTheme().planningColor,
		width: Dimensions.get("window").width - 50,
		height: 100,
	},
	hourDelimitation: {
		flexDirection: "row",
	},
	sideHourSeparator: {
		width: 50,
		alignItems: "center",
	},
	hour: {
		fontSize: 12,
		color: getTheme().gray,
		transform: [{ translateY: -8 }],
		fontFamily: "Rubik-Regular",
	},
	noClassButton: {
		backgroundColor: getTheme().blue,
		padding: 15,
		borderRadius: 10,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
		flex: 0.75,
		marginTop: 15,
	},
	noClassButtonText: {
		color: getTheme().white,
		fontFamily: "Rubik-Regular",
	},
	noClassDescription: {
		color: getTheme().gray,
		fontFamily: "Rubik-Regular",
		fontSize: 14,
		marginTop: 5,
		lineHeight: 22,
	},
	noClassTitle: {
		color: getTheme().header,
		fontFamily: "Rubik-Bold",
		fontSize: 18,
	},
	noClassContainer: {
		position: "absolute",
		bottom: 10,
		left: 10,
		width: Dimensions.get("window").width - 20,
		flex: 1,
		padding: 15,
		borderRadius: 10,
		backgroundColor: getTheme().eventColor,
	},
});
