import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import moment, { type Moment } from "moment";
import "moment/locale/fr";
import Colors from "../../constants/Colors";
import darkMode from "./styles/darkMode";
import lightMode from "./styles/lightMode";
import RipplePressable from "../../components/RipplePressable";
import Calendar from "../../components/Calendar";
import HourIndicator from "../../components/HourIndicator";
import getMealEvent from "../../utils/getMealEvent";
import type DefaultSettings from "../../constants/DefaultSettings";
import type {
	MealEvent,
	Planning as PlanningType,
	PlanningEvent,
} from "../../types/Planning";

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
	selectedDate: Moment;
	setSelectedDate: (date: Moment) => void;
	theme: "light" | "dark";
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
	selectedDate,
	setSelectedDate,
	theme,
}: PlanningProps) {
	const [nextClassDay, setNextClassDay] = useState<Moment | null>(null);
	const [styles, setStyles] = useState(lightMode);

	function changeDay(date: Moment) {
		setSelectedDate(date);

		const events = planningData[date.format("YYYY-MM-DD")] ?? [];

		setDayEvents(events);
		setMealEvent(getMealEvent(events));
	}

	useEffect(() => {
		if (Object.keys(planningData).length !== 0) {
			const nextDay = selectedDate.clone();

			for (let i = 0; i < Object.keys(planningData).length; i++) {
				if (planningData[nextDay.format("YYYY-MM-DD")])
					return setNextClassDay(nextDay);

				nextDay.add(1, "day");
			}
		}
	}, [planningData, selectedDate]);

	useEffect(() => {
		if (theme === "dark") {
			setStyles(darkMode);
		} else {
			setStyles(lightMode);
		}
	}, [theme]);

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
						<MaterialIcons
							name="keyboard-arrow-left"
							size={24}
							color={Colors.white}
						/>
					</RipplePressable>
					<RipplePressable
						duration={500}
						rippleColor="#0001"
						style={styles.subHeadButton}
						onPress={() => !calendarDeployed && setCalendarDeployed(true)}
					>
						<MaterialIcons
							name="edit-calendar"
							size={20}
							color={Colors.white}
						/>
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
							color={Colors.white}
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
				theme={theme}
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
										source={require("../../assets/images/teacher.png")}
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
								<Text style={styles.room}>{event.location}</Text>
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
								color={Colors[theme].yellow}
							/>
							<Text style={styles.mealTimeText}>Pause déjeuner</Text>
						</View>
					)}
					{settings.hourIndicatorEnabled && (
						<HourIndicator date={selectedDate.clone()} theme={theme} />
					)}
				</View>
			</ScrollView>
			{dayEvents.length === 0 && nextClassDay?.isAfter(selectedDate) && (
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
						<MaterialIcons
							name="edit-calendar"
							size={20}
							color={Colors.white}
						/>
						<Text style={styles.noClassButtonText}>
							Aller au {nextClassDay.format("dddd DD MMMM")}
						</Text>
					</RipplePressable>
				</View>
			)}
		</View>
	);
}
