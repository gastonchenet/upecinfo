import React, { useCallback, useEffect, useState } from "react";
import {
	Dimensions,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	View,
	StatusBar as StatusBarRN,
	Pressable,
	Appearance,
	type ColorSchemeName,
	Switch,
} from "react-native";
import { EventProvider } from "react-native-outside-press";
import { MaterialIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import type { MealEvent, Planning, PlanningEvent } from "./types/Planning";
import moment, { type Moment } from "moment";
import "moment/locale/fr";
import getTheme from "./utils/getTheme";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import RipplePressable from "./components/RipplePressable";
import Calendar from "./components/Calendar";
import fetchPlanning from "./utils/fetchPlanning";

const HSL_ROTAION = 360;
const MAX_COLORS = 12;
const PLANNING_START = 8;
const PLANNING_END = 20;
const MIN_MEAL_TIME = 10;
const MAX_MEAL_TIME = 14;
const MIN_MEAL_DURATION = 30;
const DEFAULT_PAGE = 0;

const PLANNING_SEM1_ID =
	"12eb8a95bf5cdd01a0664d355b3b147b84d8496df83298c294124e3689344ff0692613b21192e5f0e0b7c5a5601c933d03e6e404a2ef1e51fca07eaab12391238ffb1be556a74e192cd70cd02544128bc0d6a1a7ae54e41df012f10f27e4ca97,1";

const PLANNING_SEM2_ID =
	"c7467108d6e35146073b1b2fb9f87d9384d8496df83298c294124e3689344ff0692613b21192e5f0e0b7c5a5601c933d03e6e404a2ef1e51fca07eaab12391238ffb1be556a74e192cd70cd02544128bc0d6a1a7ae54e41df012f10f27e4ca97,1";

preventAutoHideAsync();
moment.locale("fr");

let alreadyAnimated = false;

function stringToColor(str: string) {
	const hash = str.split("").reduce((acc, char) => {
		acc = (acc << 5) - acc + char.charCodeAt(0) ** 3;
		return acc & acc;
	}, 0);

	const rotation = (hash % HSL_ROTAION) * (HSL_ROTAION / MAX_COLORS);

	return `hsl(${rotation}, 90%, 75%)`;
}

function getDayBounds(dayEvents: PlanningEvent[]) {
	if (dayEvents.length === 0) return [];
	return [dayEvents[0].start, dayEvents.at(-1)!.end];
}

function getMealEvent(dayEvents: PlanningEvent[]) {
	const dayHoles: MealEvent[] = [];

	for (let i = 0; i < dayEvents.length - 1; i++) {
		const start = moment(dayEvents[i].end);
		const end = moment(dayEvents[i + 1].start);
		const duration = end.diff(start, "minutes");

		dayHoles.push({ start, end, duration });
	}

	const sortedHoles = dayHoles
		.filter(
			(e) =>
				e.duration >= MIN_MEAL_DURATION &&
				e.start.hour() >= MIN_MEAL_TIME &&
				e.end.hour() <= MAX_MEAL_TIME
		)
		.sort((a, b) => b.duration - a.duration);

	return sortedHoles[0] ?? null;
}

export default function App() {
	const [loading, setLoading] = useState(true);
	const [planningData, setPlanningData] = useState<Planning>({});
	const [time, setTime] = useState(moment());
	const [selectedDate, setSelectedDate] = useState(moment());
	const [calendarDeployed, setCalendarDeployed] = useState(false);
	const [dayEvents, setDayEvents] = useState<PlanningEvent[]>([]);
	const [mealEvent, setMealEvent] = useState<MealEvent | null>(null);

	function changeDay(date: Moment) {
		setSelectedDate(date);

		const events = planningData[date.format("YYYY-MM-DD")] ?? [];

		setDayEvents(events);
		setMealEvent(getMealEvent(events));
	}

	const [fontsLoaded] = useFonts({
		"Rubik-Regular": require("./assets/fonts/Rubik-Regular.ttf"),
		"Rubik-Italic": require("./assets/fonts/Rubik-Italic.ttf"),
		"Rubik-Bold": require("./assets/fonts/Rubik-Bold.ttf"),
		"Rubik-ExtraBold": require("./assets/fonts/Rubik-ExtraBold.ttf"),
	});

	useEffect(() => {
		Promise.all([
			fetchPlanning(PLANNING_SEM1_ID),
			fetchPlanning(PLANNING_SEM2_ID),
		]).then((data) => {
			const planningData = { ...data[0], ...data[1] };
			setPlanningData(planningData);

			const events = planningData[moment().format("YYYY-MM-DD")] ?? [];

			setDayEvents(events);
			setMealEvent(getMealEvent(events));
			setLoading(false);
		});

		const interval = setInterval(() => setTime(moment()), 1000);
		return () => clearInterval(interval);
	}, []);

	const onLayoutRootView = useCallback(async () => {
		if (!loading && fontsLoaded) return await hideAsync();
	}, [loading, fontsLoaded]);

	if (loading || !fontsLoaded) return null;

	return (
		<EventProvider onLayout={onLayoutRootView}>
			<GestureHandlerRootView style={styles.container}>
				<StatusBar style="light" />
				<View style={styles.head}>
					<Image
						source={require("./assets/images/icon.png")}
						style={styles.appIcon}
					/>
					<View style={styles.headText}>
						<Text style={styles.appTitle}>UPEC Planning</Text>
						<Text style={styles.appDescription}>Filière informatique</Text>
					</View>
				</View>
				<ScrollView
					style={styles.container}
					showsHorizontalScrollIndicator={false}
					bounces={false}
					horizontal
					pagingEnabled
					ref={(ref) => {
						if (alreadyAnimated) return;

						ref?.scrollTo({
							x: Dimensions.get("window").width * DEFAULT_PAGE,
							animated: false,
						});

						alreadyAnimated = true;
					}}
				>
					<View style={styles.settings}>
						<View style={styles.subHead}>
							<Text style={styles.subHeadDay}>Paramètres de l'application</Text>
						</View>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								paddingHorizontal: 15,
								gap: 10,
							}}
						>
							<Text
								style={{
									fontFamily: "Rubik-Regular",
									color: getTheme().header,
								}}
							>
								Thème Sombre
							</Text>
							<Text
								style={{
									fontFamily: "Rubik-Regular",
									fontSize: 12,
									color: getTheme().gray,
								}}
							>
								(en développement)
							</Text>
							<Switch
								value={Appearance.getColorScheme() === "dark"}
								style={{ marginLeft: "auto" }}
							/>
						</View>
					</View>
					<View style={styles.dayPlanning}>
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
									onPress={() =>
										changeDay(selectedDate.subtract(1, "day").clone())
									}
								>
									<MaterialIcons
										name="keyboard-arrow-left"
										size={24}
										color="white"
									/>
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
									onPress={() => changeDay(selectedDate.add(1, "day").clone())}
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
								{Array.from(
									{ length: PLANNING_END - PLANNING_START },
									(_, i) => (
										<View key={i} style={styles.hourDelimitation}>
											<View style={styles.sideHourSeparator}>
												{i !== 0 && (
													<Text style={styles.hour}>
														{i + PLANNING_START}h00
													</Text>
												)}
											</View>
											<View
												style={[
													styles.hourSeparator,
													{ borderTopWidth: i === 0 ? 0 : 1 },
												]}
											/>
										</View>
									)
								)}
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
														selectedDate.startOf("day"),
														"minutes"
													) /
														60 -
														PLANNING_START) *
													100,
												height:
													(moment(event.end).diff(
														moment(event.start),
														"minutes"
													) /
														60) *
													100,
												borderLeftColor: stringToColor(event.teacher),
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
													source={require("./assets/images/teacher.png")}
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
										<Text style={styles.room}>{event.location}</Text>
									</View>
								))}
								{mealEvent && (
									<View
										style={[
											styles.mealTimeBox,
											{
												top:
													(mealEvent.start.diff(
														selectedDate.startOf("day"),
														"minutes"
													) /
														60 -
														PLANNING_START) *
														100 +
													10,
												height:
													(mealEvent.end.diff(mealEvent.start, "minutes") /
														60) *
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
								{time.isSame(selectedDate, "day") && (
									<React.Fragment>
										<View
											style={{
												position: "absolute",
												backgroundColor: "#6da6e8",
												width: Dimensions.get("window").width,
												height: 2,
												zIndex: 100,
												top:
													(moment().diff(time.startOf("day"), "minutes") / 60 -
														PLANNING_START) *
													100,
											}}
										/>
										<View
											style={{
												position: "absolute",
												backgroundColor: "#6da6e8",
												width: 12,
												height: 12,
												borderRadius: 6,
												zIndex: 100,
												left: 50,
												transform: [{ translateY: -5 }, { translateX: -5.5 }],
												top:
													(moment().diff(time.startOf("day"), "minutes") / 60 -
														PLANNING_START) *
													100,
											}}
										/>
									</React.Fragment>
								)}
							</View>
						</ScrollView>
					</View>
				</ScrollView>
			</GestureHandlerRootView>
		</EventProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: getTheme().primary,
	},
	dayPlanning: {
		flex: 1,
		width: Dimensions.get("window").width,
	},
	settings: {
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
	head: {
		alignItems: "center",
		flexDirection: "row",
		paddingTop: StatusBarRN.currentHeight! - 10,
		paddingHorizontal: 10,
		backgroundColor: getTheme().accent,
		gap: 10,
	},
	appIcon: {
		width: 78,
		height: 78,
	},
	headText: {
		justifyContent: "center",
		marginBottom: 8,
	},
	appTitle: {
		color: getTheme().white,
		fontSize: 24,
		fontFamily: "Rubik-ExtraBold",
		lineHeight: 28,
	},
	appDescription: {
		color: getTheme().white80,
		fontWeight: "400",
		fontSize: 12,
		fontFamily: "Rubik-Regular",
		lineHeight: 18,
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
});
