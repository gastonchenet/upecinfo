import { StatusBar } from "expo-status-bar";
import {
	Dimensions,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	View,
	StatusBar as StatusBarRN,
	Appearance,
} from "react-native";
import moment, { Moment } from "moment";
import { useCallback, useEffect, useState } from "react";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import Colors from "./constants/Colors";
import "moment/locale/fr";
import { MaterialIcons } from "@expo/vector-icons";
import RipplePressable from "./components/RipplePressable";
import { GestureHandlerRootView } from "react-native-gesture-handler";

type PlanningEvent = {
	start: Moment;
	end: Moment;
	summary: string;
	location: string;
	teacher: string;
};

const HSL_ROTAION = 360;
const MAX_COLORS = 12;
const PLANNING_START = 8;
const PLANNING_END = 20;

const PLANNING_URL =
	"https://ade.u-pec.fr/jsp/custom/modules/plannings/anonymous_cal.jsp";

const PLANNING_SEM1_ID =
	"12eb8a95bf5cdd01a0664d355b3b147b84d8496df83298c294124e3689344ff0692613b21192e5f0e0b7c5a5601c933d03e6e404a2ef1e51fca07eaab12391238ffb1be556a74e192cd70cd02544128bc0d6a1a7ae54e41df012f10f27e4ca97,1";

const PLANNING_SEM2_ID =
	"c7467108d6e35146073b1b2fb9f87d9384d8496df83298c294124e3689344ff0692613b21192e5f0e0b7c5a5601c933d03e6e404a2ef1e51fca07eaab12391238ffb1be556a74e192cd70cd02544128bc0d6a1a7ae54e41df012f10f27e4ca97,1";

moment.locale("fr");

preventAutoHideAsync();

function getItemValue(raw: string) {
	return raw.split(":")[1];
}

function getTheme() {
	return Colors[Appearance.getColorScheme() ?? "light"];
}

async function fetchPlanning(planningId: string) {
	const url = new URL(PLANNING_URL);
	url.searchParams.set("data", planningId);

	const res = await fetch(url.toString(), {
		method: "GET",
		headers: {
			Accept: "*/*",
			"User-Agent": "UpecPlanning/1.0 (com.ducassoulet.planning)",
		},
	});

	if (!res.ok) return [];
	const rawData = await res.text();
	const data: PlanningEvent[] = [];

	rawData.split("BEGIN:VEVENT").forEach((event, i) => {
		if (!event.includes("END:VEVENT")) return;

		const lines = event.split("\n");
		const start = lines.find((line) => line.startsWith("DTSTART:"));
		const end = lines.find((line) => line.startsWith("DTEND:"));
		const summary = lines.find((line) => line.startsWith("SUMMARY:"));
		const location = lines.find((line) => line.startsWith("LOCATION:"));
		const description = lines.find((line) => line.startsWith("DESCRIPTION:"));

		if (!start || !end || !summary || !location || !description) return;

		const parsedStart = moment(
			getItemValue(start),
			"YYYYMMDDTHHmmssZ"
		).utcOffset("+01:00");

		const parsedEnd = moment(getItemValue(end), "YYYYMMDDTHHmmssZ").utcOffset(
			"+01:00"
		);

		const parsedLocation = getItemValue(location)
			.replace(/\s*\(\d+\)/g, "")
			.trim();

		const parsedTeacher = getItemValue(description)
			.split(/(?:\\n)+/)
			.at(-2);

		if (!parsedTeacher) return;

		data.push({
			start: parsedStart,
			end: parsedEnd,
			summary: getItemValue(summary),
			location: parsedLocation,
			teacher: parsedTeacher,
		});
	});

	return data;
}

function stringToColor(str: string) {
	const hash = str.split("").reduce((acc, char) => {
		acc = (acc << 5) - acc + char.charCodeAt(0) ** 10;
		return acc & acc;
	}, 0);

	const rotation = (hash % HSL_ROTAION) * (HSL_ROTAION / MAX_COLORS);

	return `hsl(${rotation}, 90%, 75%)`;
}

function getDayBounds(dayEvents: PlanningEvent[]) {
	dayEvents = dayEvents.sort((a, b) => a.start.diff(b.start, "minutes"));
	if (dayEvents.length === 0) return [];
	return [dayEvents[0].start, dayEvents.at(-1)!.end];
}

function getDayEvents(
	planning: PlanningEvent[],
	date: Moment
): PlanningEvent[] {
	return planning.filter(
		(event) => event.start.isSame(date, "day") && event.end.isSame(date, "day")
	);
}

export default function App() {
	const [loading, setLoading] = useState(true);
	const [planningData, setPlanningData] = useState<PlanningEvent[]>([]);
	const [selectedDate, setSelectedDate] = useState(Date.now());

	useEffect(() => {
		Promise.all([
			fetchPlanning(PLANNING_SEM1_ID),
			fetchPlanning(PLANNING_SEM2_ID),
		]).then((data) => {
			setPlanningData(data.flat());
			setLoading(false);
		});
	}, []);

	const onLayoutRootView = useCallback(async () => {
		if (!loading) return await hideAsync();
	}, [loading]);

	if (loading) return null;

	return (
		<GestureHandlerRootView
			style={styles.container}
			onLayout={onLayoutRootView}
		>
			<StatusBar style="light" />
			<View style={styles.head}>
				<Image source={require("./assets/icon.png")} style={styles.appIcon} />
				<View style={styles.headText}>
					<Text style={styles.appTitle}>UPEC Planning</Text>
					<Text style={styles.appDescription}>Filière informatique</Text>
				</View>
			</View>
			<View style={styles.container}>
				<View style={styles.dayPlanning}>
					<View style={styles.subHead}>
						<View style={styles.subHeadDayInfo}>
							<Text style={styles.subHeadDay}>
								{moment(selectedDate).isSame(moment(), "day")
									? "aujourd'hui"
									: moment(selectedDate).isSame(moment().add(1, "day"), "day")
									? "demain"
									: moment(selectedDate).isSame(
											moment().subtract(1, "day"),
											"day"
									  )
									? "hier"
									: moment(selectedDate).format("ddd DD MMMM")}
							</Text>
							{getDayEvents(planningData, moment(selectedDate)).length > 0 ? (
								<Text style={styles.subHeadDayBounds}>
									(
									{getDayBounds(
										getDayEvents(planningData, moment(selectedDate))
									)
										.map((d) => d.format("HH[h]mm"))
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
								onPress={() => setSelectedDate((prev) => prev - 86400000)}
							>
								<MaterialIcons
									name="keyboard-arrow-left"
									size={24}
									color="white"
								/>
							</RipplePressable>
							{/* <RipplePressable
								duration={500}
								rippleColor="#0001"
								style={styles.subHeadButton}
							>
								<MaterialIcons name="edit-calendar" size={20} color="white" />
							</RipplePressable> */}
							<RipplePressable
								duration={500}
								rippleColor="#0001"
								style={styles.subHeadButton}
								onPress={() => setSelectedDate((prev) => prev + 86400000)}
							>
								<MaterialIcons
									name="keyboard-arrow-right"
									size={24}
									color="white"
								/>
							</RipplePressable>
						</View>
					</View>
					<ScrollView
						contentContainerStyle={styles.planningContainer}
						showsVerticalScrollIndicator={false}
						ref={(ref) =>
							ref?.scrollTo({
								x: 0,
								y: moment(selectedDate).isSame(moment(), "day")
									? (moment(selectedDate).hour() - PLANNING_START) * 100 -
									  Dimensions.get("window").height / 2
									: 0,
								animated: true,
							})
						}
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
							{getDayEvents(planningData, moment(selectedDate))
								.sort((a, b) => a.start.diff(b.start, "minutes"))
								.map((event, index) => (
									<View
										key={index}
										style={[
											styles.event,
											{
												top:
													(event.start.diff(
														moment(selectedDate).startOf("day"),
														"minutes"
													) /
														60 -
														PLANNING_START) *
													100,
												height:
													(event.end.diff(event.start, "minutes") / 60) * 100,
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
													source={require("./assets/teacher.png")}
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
												{event.start.format("HH[h]mm")} -{" "}
												{event.end.format("HH[h]mm")}
											</Text>
										</View>
										<Text style={styles.room}>{event.location}</Text>
									</View>
								))}
						</View>
					</ScrollView>
				</View>
			</View>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: getTheme().primary,
	},
	dayPlanning: {
		flex: 1,
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
		fontWeight: "500",
		fontSize: 12,
	},
	boundaries: {
		fontWeight: "400",
		color: getTheme().lightGray,
		fontSize: 12,
		marginTop: "auto",
	},
	title: {
		fontWeight: Appearance.getColorScheme() === "dark" ? "700" : "900",
		fontSize: 18,
		color: getTheme().header,
	},
	teacher: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	teacherText: {
		fontSize: 15,
		color: getTheme().teacherColor,
		fontStyle: "italic",
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
		fontWeight: "900",
		fontSize: 24,
	},
	appDescription: {
		color: getTheme().white80,
		fontWeight: "400",
		fontSize: 12,
	},
	subHead: {
		paddingHorizontal: 15,
		paddingVertical: 5,
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
		fontWeight: "700",
		fontSize: 16,
	},
	subHeadDayBounds: {
		color: getTheme().white80,
		fontSize: 12,
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
		transform: [{ translateY: -10 }],
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
});
