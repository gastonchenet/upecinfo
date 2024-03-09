import React, { useCallback, useEffect, useState } from "react";
import {
	Dimensions,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	View,
	StatusBar as StatusBarRN,
	Appearance,
	ActivityIndicator,
	Pressable,
	Keyboard,
} from "react-native";
import { EventProvider } from "react-native-outside-press";
import { MaterialIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import {
	type MealEvent,
	type Planning as PlanningType,
	type PlanningEvent,
	type Promo,
	type Promos,
	Sector,
} from "./types/Planning";
import moment from "moment";
import "moment/locale/fr";
import getTheme from "./utils/getTheme";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import RipplePressable from "./components/RipplePressable";
import fetchPlanning from "./utils/fetchPlanning";
import { Semester, Evaluation, Distribution } from "./types/Notes";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import app from "./app.json";
import BottomModal from "./components/BottomModal";
import fetchPromos from "./utils/fetchPromos";
import Graph from "./components/Graph";
import fetchNoteDistribution from "./utils/fetchNoteDistribution";
import ImageVisualizer from "./components/ImageVisualizer";
import Settings from "./screens/Settings";
import registerForPushNotificationsAsync from "./utils/registerForPushNotificationsAsync";
import Information from "./screens/Information";
import Planning from "./screens/Planning";
import getMealEvent from "./utils/getMealEvent";
import Notes from "./screens/Notes";
import DefaultSettings from "./constants/DefaultSettings";

type Auth = {
	username: string;
	password: string;
};

const DEFAULT_PAGE = 1;

preventAutoHideAsync();
moment.locale("fr");

let alreadyAnimated = false;

export default function App() {
	const [planningData, setPlanningData] = useState<PlanningType>({});
	const [calendarDeployed, setCalendarDeployed] = useState(false);
	const [dayEvents, setDayEvents] = useState<PlanningEvent[]>([]);
	const [mealEvent, setMealEvent] = useState<MealEvent | null>(null);
	const [semesters, setSemesters] = useState<Semester[]>([]);
	const [selectedSemester, setSelectedSemester] = useState(0);
	const [auth, setAuth] = useState<Auth | null>(null);
	const [editingPromo, setEditingPromo] = useState(false);
	const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
	const [disconnecting, setDisconnecting] = useState(false);
	const [settings, setSettings] = useState(DefaultSettings);
	const [selectedNote, setSelectedNote] = useState<Evaluation | null>(null);
	const [promos, setPromos] = useState<Promos>({});
	const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

	const [promo, setPromo] = useState<
		{ sector: Sector } | (Promo & { sector: Sector }) | null
	>(null);

	const [image, setImage] = useState<{
		url: string;
		width: number;
		height: number;
	} | null>(null);

	const [noteDistribution, setNoteDistribution] = useState<Distribution | null>(
		null
	);

	async function selectNote(note: Evaluation | null) {
		setSelectedNote(note);
		if (!note || !auth) return setNoteDistribution(null);

		const [success, distribution] = await fetchNoteDistribution(
			note.id,
			auth.username,
			auth.password
		);

		if (success) setNoteDistribution(distribution);
	}

	async function changePlanning() {
		setEditingPromo(true);
		setPromo(null);
		setPlanningData({});
	}

	function changeSector(sector: Sector) {
		setEditingPromo(true);
		setPromo({ sector });
	}

	async function changePromo(p: Promo & { fetching: boolean }) {
		setEditingPromo(false);
		setPromo({ sector: promo!.sector, ...p });

		Object.values(promos)
			.flat()
			.forEach((p) => (p.fetching = false));

		p.fetching = true;
		setPromos({ ...promos });

		fetchPlanning(promo!.sector, p.year, p.campus, p.group, expoPushToken).then(
			([success, data]) => {
				if (success) {
					setPlanningData(data);
					const events = data[moment().format("YYYY-MM-DD")] ?? [];
					setDayEvents(events);
					setMealEvent(getMealEvent(events));

					setItemAsync(
						"promo",
						JSON.stringify({ sector: promo!.sector, ...p })
					);
				} else {
					deleteItemAsync("promo");
					setPromo(null);
				}

				p.fetching = false;
				setPromos({ ...promos });
			}
		);
	}

	async function disconnect() {
		setDisconnecting(true);
		setAuth(null);
		setSemesters([]);
		setSelectedSemester(0);
		await deleteItemAsync("auth");
		setDisconnecting(false);
		setDisconnectModalVisible(false);
	}

	function setSettingsValue(key: keyof typeof DefaultSettings, value: boolean) {
		setSettings({ ...settings, [key]: value });
		setItemAsync("settings", JSON.stringify({ ...settings, [key]: value }));
	}

	const [fontsLoaded] = useFonts({
		"Rubik-Regular": require("./assets/fonts/Rubik-Regular.ttf"),
		"Rubik-Italic": require("./assets/fonts/Rubik-Italic.ttf"),
		"Rubik-Bold": require("./assets/fonts/Rubik-Bold.ttf"),
		"Rubik-ExtraBold": require("./assets/fonts/Rubik-ExtraBold.ttf"),
	});

	useEffect(() => {
		fetchPromos().then((data) => {
			const promos: Promos = {};

			for (const sector in data) {
				promos[sector] = data[sector].map((promo) => ({
					...promo,
					fetching: false,
				}));
			}

			setPromos(promos);
		});

		getItemAsync("settings").then(async (data) => {
			if (!data) return;

			const settings = {
				...DefaultSettings,
				...JSON.parse(data),
			};

			setSettings(settings);

			let token: string | null = null;

			if (settings.planningNotificationEnabled) {
				token = (await registerForPushNotificationsAsync()) ?? null;
				setExpoPushToken(token);
			}

			getItemAsync("promo").then((data) => {
				if (!data) return setEditingPromo(true);
				const promo: Promo & { sector: Sector } = JSON.parse(data);
				setPromo(promo);

				fetchPlanning(
					promo.sector,
					promo.year,
					promo.campus,
					promo.group,
					token
				).then(([success, data]) => {
					if (success) {
						setPlanningData(data);
						const events = data[moment().format("YYYY-MM-DD")] ?? [];
						setDayEvents(events);
						setMealEvent(getMealEvent(events));
					} else {
						deleteItemAsync("promo");
						setEditingPromo(true);
						setPromo(null);
					}
				});
			});
		});
	}, [
		setAuth,
		setSemesters,
		setSelectedSemester,
		setPromos,
		setSettings,
		setExpoPushToken,
		setPlanningData,
		setDayEvents,
		setMealEvent,
		setPromo,
	]);

	const onLayoutRootView = useCallback(async () => {
		if (fontsLoaded && Object.keys(promos).length > 0) return await hideAsync();
	}, [fontsLoaded, promos]);

	if (!fontsLoaded || Object.keys(promos).length === 0) return null;

	return (
		<EventProvider onLayout={onLayoutRootView}>
			<GestureHandlerRootView
				style={[styles.container, { backgroundColor: getTheme().primary }]}
			>
				<StatusBar style="light" />
				<ImageVisualizer
					image={image}
					onClose={() => setImage(null)}
					padding={25}
				/>
				<BottomModal
					title="Déconnexion"
					visible={disconnectModalVisible}
					onClose={() => setDisconnectModalVisible(false)}
				>
					<Text style={styles.modalDescription}>
						Es-tu sûr de vouloir te déconnecter ?
					</Text>
					<View style={styles.modalButtons}>
						<RipplePressable
							duration={500}
							rippleColor="#0001"
							style={[styles.modalButton, styles.modalButtonDanger]}
							onPress={disconnect}
						>
							{disconnecting && (
								<ActivityIndicator size="small" color={getTheme().white} />
							)}
							<Text
								style={[styles.modalButtonText, styles.modalButtonDangerText]}
							>
								Déconnection
							</Text>
						</RipplePressable>
						<RipplePressable
							duration={500}
							rippleColor={
								Appearance.getColorScheme() === "dark" ? "#fff1" : "#0001"
							}
							style={styles.modalButton}
							onPress={() => setDisconnectModalVisible(false)}
						>
							<Text style={styles.modalButtonText}>Annuler</Text>
						</RipplePressable>
					</View>
				</BottomModal>
				<BottomModal
					title={selectedNote?.title ?? null}
					visible={!!selectedNote}
					onClose={() => selectedNote && selectNote(null)}
				>
					<Text style={styles.evalItem}>
						<Text style={styles.evalItemLabel}>Note</Text>
						{"  "}
						{selectedNote?.note.toLocaleString("fr-FR", {
							maximumFractionDigits: 2,
							minimumFractionDigits: 2,
						})}{" "}
						(Coef {selectedNote?.coefficient.toLocaleString("fr-FR")})
					</Text>
					<Text style={styles.evalItem}>
						<Text style={styles.evalItemLabel}>Moyenne de la classe</Text>
						{"  "}
						{selectedNote?.average.toLocaleString("fr-FR", {
							maximumFractionDigits: 2,
							minimumFractionDigits: 2,
						})}
					</Text>
					<Text style={styles.evalItem}>
						<Text style={styles.evalItemLabel}>Note Minimale</Text>
						{"  "}
						{selectedNote?.min_note.toLocaleString("fr-FR", {
							maximumFractionDigits: 2,
							minimumFractionDigits: 2,
						})}
					</Text>
					<Text style={styles.evalItem}>
						<Text style={styles.evalItemLabel}>Note Maximale</Text>
						{"  "}
						{selectedNote?.max_note.toLocaleString("fr-FR", {
							maximumFractionDigits: 2,
							minimumFractionDigits: 2,
						})}
					</Text>
					{noteDistribution ? (
						<Graph
							padding={20}
							distribution={noteDistribution}
							note={selectedNote?.note ?? 0}
						/>
					) : (
						<ActivityIndicator
							size="large"
							color="#29afa3"
							style={styles.graphLoader}
						/>
					)}

					<Text style={styles.dateText}>
						{selectedNote?.date
							? moment(selectedNote.date).format("ddd d MMM YYYY, HH[h]mm")
							: "Date non renseignée"}
					</Text>
				</BottomModal>
				<BottomModal
					title="Changer de promotion"
					visible={editingPromo}
					canBeClosed={false}
					contentStyle={styles.planningChangeContent}
					boxStyle={styles.planningChangeBottomModal}
				>
					<ScrollView
						contentContainerStyle={styles.promoSelectorContainer}
						showsVerticalScrollIndicator={false}
					>
						{promo?.sector
							? promos[promo.sector].map((promo, index) => (
									<Pressable
										key={index}
										style={styles.promoSelector}
										onPress={() => changePromo(promo)}
									>
										<Text style={styles.promoText}>{promo.name}</Text>
										{promo.fetching ? (
											<View style={styles.arrowButtonActivityContainer}>
												<ActivityIndicator
													size="small"
													color={getTheme().darkGray}
												/>
											</View>
										) : (
											<View style={styles.arrowButtonContainer}>
												<MaterialIcons
													name="arrow-forward"
													size={20}
													color={getTheme().light}
												/>
											</View>
										)}
									</Pressable>
							  ))
							: Object.keys(promos).map((sector, index) => (
									<Pressable
										key={index}
										style={styles.promoSelector}
										onPress={() => changeSector(sector as Sector)}
									>
										<Text style={styles.promoText}>{sector.toUpperCase()}</Text>
										<View style={styles.arrowButtonContainer}>
											<MaterialIcons
												name="arrow-forward"
												size={20}
												color={getTheme().light}
											/>
										</View>
									</Pressable>
							  ))}
					</ScrollView>
				</BottomModal>
				<View style={styles.head}>
					<Image
						source={require("./assets/images/upec.png")}
						style={styles.appIcon}
						resizeMode="center"
					/>
					<View style={styles.headText}>
						<Text style={styles.appTitle}>{app.expo.name}</Text>
						<Text style={styles.appDescription}>
							{promo?.sector ? "Filière " + promo?.sector?.toUpperCase() : ""}
							{(promo as Promo)?.name ? ` - ${(promo as Promo).name}` : ""}
						</Text>
					</View>
				</View>
				<ScrollView
					style={[styles.container, { backgroundColor: getTheme().primary }]}
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
					onScroll={() => {
						Keyboard.dismiss();
						setDisconnectModalVisible(false);
						setCalendarDeployed(false);
						if (selectedNote) selectNote(null);
					}}
				>
					<Settings
						setDisconnectModalVisible={setDisconnectModalVisible}
						setSettingsValue={setSettingsValue}
						changePlanning={changePlanning}
						settings={settings}
						promo={promo as Promo | null}
						expoPushToken={expoPushToken}
						setExpoPushToken={setExpoPushToken}
					/>
					<Planning
						calendarDeployed={calendarDeployed}
						dayEvents={dayEvents}
						mealEvent={mealEvent}
						planningData={planningData}
						setCalendarDeployed={setCalendarDeployed}
						setDayEvents={setDayEvents}
						setMealEvent={setMealEvent}
						settings={settings}
					/>
					{promo?.sector === Sector.Info && (
						<Notes
							auth={auth}
							selectNote={selectNote}
							selectedSemester={selectedSemester}
							semesters={semesters}
							setAuth={setAuth}
							setSelectedSemester={setSelectedSemester}
							setSemesters={setSemesters}
						/>
					)}
					{promo?.sector === Sector.Info && auth && (
						<Information setImage={setImage} />
					)}
				</ScrollView>
			</GestureHandlerRootView>
		</EventProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	head: {
		alignItems: "center",
		flexDirection: "row",
		paddingTop: StatusBarRN.currentHeight!,
		paddingHorizontal: 15,
		paddingBottom: 5,
		backgroundColor: getTheme().accent,
		gap: 15,
	},
	appIcon: {
		width: 50,
		height: 32,
		marginBottom: 8,
	},
	headText: {
		justifyContent: "center",
		marginBottom: 8,
	},
	appTitle: {
		color: getTheme().white,
		fontSize: 22,
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
	modalButtons: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 20,
	},
	modalDescription: {
		fontFamily: "Rubik-Regular",
		color: getTheme().gray,
		fontSize: 14,
	},
	modalButton: {
		backgroundColor: getTheme().borderColor,
		padding: 15,
		borderRadius: 10,
		flex: 1,
		marginTop: 15,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
	},
	modalButtonText: {
		fontFamily: "Rubik-Regular",
		color: getTheme().header80,
		textAlign: "center",
	},
	modalButtonDanger: {
		backgroundColor: getTheme().red,
	},
	modalButtonDangerText: {
		color: getTheme().white,
	},
	dateText: {
		marginTop: 15,
		color: getTheme().lightGray,
		fontSize: 12,
		fontFamily: "Rubik-Regular",
		textTransform: "capitalize",
	},
	evalItem: {
		fontFamily: "Rubik-Regular",
		color: getTheme().header,
	},
	evalItemLabel: {
		fontFamily: "Rubik-Bold",
		color: getTheme().gray,
		fontSize: 12,
		textTransform: "uppercase",
	},
	promoSelectorContainer: {
		gap: 15,
		paddingVertical: 15,
	},
	promoSelector: {
		borderWidth: 2,
		borderColor: getTheme().gray,
		borderRadius: 10,
		padding: 10,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 10,
	},
	promoText: {
		fontFamily: "Rubik-Regular",
		color: getTheme().header,
		fontSize: 13,
		marginLeft: 5,
	},
	arrowButtonActivityContainer: {
		height: 30,
		width: 30,
		justifyContent: "center",
		alignItems: "center",
	},
	arrowButtonContainer: {
		height: 30,
		width: 30,
		backgroundColor: getTheme().darkGray,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 15,
	},
	planningChangeContent: {
		maxHeight: 380,
	},
	planningChangeBottomModal: {
		paddingBottom: 0,
	},
	settingButtonDescription: {
		fontFamily: "Rubik-Regular",
		color: getTheme().lightGray,
		fontSize: 12,
		marginTop: 2,
	},
	graphLoader: {
		marginTop: 40,
	},
});
