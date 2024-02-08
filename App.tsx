import React, { useCallback, useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { EventProvider } from "react-native-outside-press";
import Home from "./screens/Home";
import { useFonts } from "expo-font";
import fetchPlanning from "./utils/fetchPlanning";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import type { PlanningEvent } from "./types/Planning";
import moment from "moment";
import "moment/locale/fr";

const PLANNING_SEM1_ID =
	"12eb8a95bf5cdd01a0664d355b3b147b84d8496df83298c294124e3689344ff0692613b21192e5f0e0b7c5a5601c933d03e6e404a2ef1e51fca07eaab12391238ffb1be556a74e192cd70cd02544128bc0d6a1a7ae54e41df012f10f27e4ca97,1";

const PLANNING_SEM2_ID =
	"c7467108d6e35146073b1b2fb9f87d9384d8496df83298c294124e3689344ff0692613b21192e5f0e0b7c5a5601c933d03e6e404a2ef1e51fca07eaab12391238ffb1be556a74e192cd70cd02544128bc0d6a1a7ae54e41df012f10f27e4ca97,1";

preventAutoHideAsync();
moment.locale("fr");

const Stack = createStackNavigator();

export default function App() {
	const [loading, setLoading] = useState(true);
	const [planningData, setPlanningData] = useState<PlanningEvent[]>([]);

	const [fontsLoaded] = useFonts({
		"Inter-Black": require("./assets/fonts/Rubik.ttf"),
	});

	useEffect(() => {
		Promise.all([
			fetchPlanning(PLANNING_SEM1_ID),
			fetchPlanning(PLANNING_SEM2_ID),
		]).then((data) => {
			setPlanningData(data.flat());
			setLoading(false);
		});
	});

	const onLayoutRootView = useCallback(async () => {
		if (!loading && fontsLoaded) return await hideAsync();
	}, [loading, fontsLoaded]);

	if (loading) return null;

	return (
		<EventProvider onLayout={onLayoutRootView}>
			<NavigationContainer>
				<Stack.Navigator
					initialRouteName="Home"
					screenOptions={{ headerShown: false }}
				>
					<Stack.Screen
						name="Home"
						component={Home}
						initialParams={{ planningData }}
					/>
				</Stack.Navigator>
			</NavigationContainer>
		</EventProvider>
	);
}
