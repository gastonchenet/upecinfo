import { StatusBar } from "expo-status-bar";
import {
	Dimensions,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import moment, { Moment } from "moment";
import { useCallback, useEffect, useState } from "react";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import Colors from "./Colors";

type PlanningEvent = {
	start: Moment;
	end: Moment;
	summary: string;
	location: string;
	teacher: string;
};

preventAutoHideAsync();

const HSL_ROTAION = 360;
const MAX_COLORS = 12;

const PLANNING_URL =
	"https://ade.u-pec.fr/jsp/custom/modules/plannings/anonymous_cal.jsp";

const PLANNING_ID =
	"c7467108d6e35146073b1b2fb9f87d9384d8496df83298c294124e3689344ff0692613b21192e5f0e0b7c5a5601c933d03e6e404a2ef1e51fca07eaab12391238ffb1be556a74e192cd70cd02544128bc0d6a1a7ae54e41df012f10f27e4ca97,1";

function getItemValue(raw: string) {
	return raw.split(":")[1];
}

async function fetchPlanning() {
	const url = new URL(PLANNING_URL);
	url.searchParams.set("data", PLANNING_ID);

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

	return `hsl(${rotation}, 90%, 70%)`;
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
	const [selectedDate, setSelectedDate] = useState(moment());

	useEffect(() => {
		fetchPlanning().then((data) => {
			setPlanningData(data);
			setLoading(false);
		});
	}, []);

	const onLayoutRootView = useCallback(async () => {
		if (!loading) return await hideAsync();
	}, [loading]);

	if (loading) return null;

	return (
		<View style={styles.container} onLayout={onLayoutRootView}>
			<StatusBar style="auto" />
			<ScrollView contentContainerStyle={styles.container} horizontal>
				<ScrollView
					contentContainerStyle={styles.planningContainer}
					showsVerticalScrollIndicator={false}
					ref={(ref) => ref?.scrollTo({ x: 0, y: 700, animated: false })}
				>
					<View>
						{Array.from({ length: 24 }, (_, i) => (
							<View
								key={i}
								style={{
									borderTopWidth: Math.min(i, 1),
									borderTopColor: "#e0e0e0",
									height: 100,
								}}
							></View>
						))}
					</View>
					<View style={{ position: "absolute" }}>
						{getDayEvents(planningData, selectedDate)
							.sort((a, b) => a.start.diff(b.start, "minutes"))
							.map((event, index) => (
								<View
									key={index}
									style={[
										styles.event,
										{
											top:
												(event.start.diff(
													selectedDate.startOf("day"),
													"minutes"
												) /
													60) *
												100,
											height:
												(event.end.diff(event.start, "minutes") / 60) * 100,
											borderLeftColor: stringToColor(event.teacher),
										},
									]}
								>
									<View>
										<Text style={styles.boundaries}>
											{event.start.format("HH:mm")} -{" "}
											{event.end.format("HH:mm")}
										</Text>
										<Text
											style={styles.title}
											ellipsizeMode="tail"
											numberOfLines={1}
										>
											{event.summary}
										</Text>
										<View style={styles.teacher}>
											<Image
												source={require("./assets/teacher.png")}
												style={{ width: 20, height: 20 }}
											/>
											<Text
												style={styles.teacherText}
												ellipsizeMode="tail"
												numberOfLines={1}
											>
												{event.teacher}
											</Text>
										</View>
									</View>
									<Text style={styles.room}>{event.location}</Text>
								</View>
							))}
					</View>
				</ScrollView>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	planningContainer: {
		backgroundColor: "#f0f0f0",
	},
	event: {
		position: "absolute",
		backgroundColor: "white",
		width: Dimensions.get("window").width,
		flexDirection: "row",
		justifyContent: "space-between",
		borderRadius: 6,
		borderLeftWidth: 6,
		padding: 10,
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
	},
	room: {
		backgroundColor: Colors.accent,
		color: "white",
		alignSelf: "flex-start",
		paddingHorizontal: 6,
		paddingVertical: 4,
		borderRadius: 5,
		fontWeight: "500",
	},
	boundaries: {
		fontWeight: "700",
		color: "#aaa",
		fontSize: 14,
	},
	title: {
		fontWeight: "900",
		fontSize: 18,
		marginTop: 4,
	},
	teacher: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	teacherText: {
		fontSize: 16,
		color: "gray",
	},
});
