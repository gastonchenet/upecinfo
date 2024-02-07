import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { getItemAsync, setItemAsync } from "expo-secure-store";
import moment, { Moment } from "moment";
import { useCallback, useEffect, useState } from "react";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";

type PlanningEvent = {
	start: Moment;
	end: Moment;
	summary: string;
	location: string;
	teacher: string;
};

preventAutoHideAsync();

const PLANNING_URL =
	"https://ade.u-pec.fr/jsp/custom/modules/plannings/anonymous_cal.jsp";

const PLANNING_ID =
	"c7467108d6e35146073b1b2fb9f87d9384d8496df83298c294124e3689344ff0692613b21192e5f0e0b7c5a5601c933d32c30bedfbe4341c0ba80a5e54c49ff38bf99c715b9a62710964a02f68e28d59f89e5e972fadaf7e0d19dff94c49310d,1";

function getItemValue(raw: string) {
	return raw.split(":")[1];
}

async function getPlanning() {
	const data = await getItemAsync("planning_json_data");
	if (!data) return null;
	return JSON.parse(data);
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

	if (!res.ok) return null;
	const rawData = await res.text();
	const data: PlanningEvent[] = [];

	rawData.split("BEGIN:VEVENT").forEach((event) => {
		if (!event.includes("END:VEVENT")) return;

		const lines = event.split("\n");
		const start = lines.find((line) => line.startsWith("DTSTART:"));
		const end = lines.find((line) => line.startsWith("DTEND:"));
		const summary = lines.find((line) => line.startsWith("SUMMARY:"));
		const location = lines.find((line) => line.startsWith("LOCATION:"));
		const description = lines.find((line) => line.startsWith("DESCRIPTION:"));
		if (!start || !end || !summary || !location || !description) return;

		const parsedTeacher = getItemValue(description).split(/\n+/).at(-2);
		if (!parsedTeacher) return;

		data.push({
			start: moment(getItemValue(start)),
			end: moment(getItemValue(end)),
			summary: getItemValue(summary),
			location: getItemValue(location),
			teacher: parsedTeacher,
		});
	});

	await setItemAsync("planning_json_data", JSON.stringify(data));

	return data;
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
		getPlanning()
			.then((data) => {
				setPlanningData(data ?? []);
				if (data) setLoading(false);
				return fetchPlanning();
			})
			.then((data) => {
				setPlanningData(data ?? []);
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
			<ScrollView contentContainerStyle={styles.container}>
				<View>
					<View>
						<Text>{selectedDate.format("dddd D MMMM")}</Text>
					</View>
					<View>
						{getDayEvents(planningData, selectedDate).map((event, index) => (
							<View key={index}>
								<Text>{event.summary}</Text>
							</View>
						))}
					</View>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "center",
	},
});
