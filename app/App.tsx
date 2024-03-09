import React, { useCallback, useEffect, useRef, useState } from "react";
import {
	Dimensions,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	View,
	StatusBar as StatusBarRN,
	Appearance,
	Switch,
	ActivityIndicator,
	Pressable,
	Keyboard,
	Linking,
	Platform,
} from "react-native";
import { EventProvider } from "react-native-outside-press";
import { MaterialIcons, FontAwesome6 } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import {
	MealEvent,
	Planning,
	PlanningEvent,
	Promo,
	Promos,
	Sector,
} from "./types/Planning";
import moment, { type Moment } from "moment";
import "moment/locale/fr";
import getTheme from "./utils/getTheme";
import {
	GestureHandlerRootView,
	TextInput,
} from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import RipplePressable from "./components/RipplePressable";
import Calendar from "./components/Calendar";
import fetchPlanning from "./utils/fetchPlanning";
import { Resource, Semester, Evaluation, Distribution } from "./types/Notes";
import fetchNotes from "./utils/fetchNotes";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import app from "./app.json";
import BottomModal from "./components/BottomModal";
import fetchPromos from "./utils/fetchPromos";
import Graph from "./components/Graph";
import fetchNoteDistribution from "./utils/fetchNoteDistribution";
import { Message } from "./types/Message";
import fetchMessages from "./utils/fetchMessages";
import { Hyperlink } from "react-native-hyperlink";
import PageModal from "./components/PageModal";
import ImageVisualizer from "./components/ImageVisualizer";
import { isDevice } from "expo-device";
import Constants from "expo-constants";
import {
	setNotificationHandler,
	setNotificationChannelAsync,
	AndroidImportance,
	getPermissionsAsync,
	requestPermissionsAsync,
	getExpoPushTokenAsync,
} from "expo-notifications";
import {
	setExpoPushToken as postExpoPushToken,
	deleteExpoPushToken,
} from "./utils/notifications";

enum ColorType {
	Pastel,
	Vibrant,
}

type Auth = {
	username: string;
	password: string;
};

const HSL_ROTAION = 360;
const MAX_COLORS = 12;
const PLANNING_START = 8;
const PLANNING_END = 20;
const MIN_MEAL_TIME = 10;
const MAX_MEAL_TIME = 16;
const IDEAL_MEAL_TIME = 12;
const MIN_MEAL_DURATION = 30;
const DEFAULT_PAGE = 1;

const DefaultSettings = Object.freeze({
	showMealBounds: true,
	planningNotificationEnabled: true,
});

preventAutoHideAsync();
moment.locale("fr");

let alreadyAnimated = false;

setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: false,
		shouldSetBadge: true,
	}),
});

async function registerForPushNotificationsAsync() {
	if (Platform.OS === "android") {
		await setNotificationChannelAsync("default", {
			name: "default",
			importance: AndroidImportance.MAX,
			vibrationPattern: [0, 250, 250, 250],
			lightColor: getTheme().accent,
		});
	}

	if (!isDevice) return;

	const { status: existingStatus } = await getPermissionsAsync();

	if (existingStatus !== "granted") {
		const { status } = await requestPermissionsAsync();
		if (status !== "granted") return;
	}

	const token = await getExpoPushTokenAsync({
		projectId: Constants.expoConfig!.extra!.eas.projectId,
	});

	return token.data;
}

function translateSizeToBits(size: number) {
	const units = ["o", "Ko", "Mo", "Go", "To"];
	let unit = 0;

	while (size > 1024) {
		size /= 1024;
		unit++;
	}

	return `${size.toLocaleString("fr", {
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
	})} ${units[unit]}`;
}

function getDefaultSemester(semesters: Semester[]) {
	const now = moment();
	const semester = semesters.find((s) => now.isBetween(s.startDate, s.endDate));
	if (!semester) return 0;

	return semesters.indexOf(semester);
}

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
		.sort(
			(a, b) =>
				Math.abs(a.duration - IDEAL_MEAL_TIME) -
				Math.abs(b.duration - IDEAL_MEAL_TIME)
		)
		.sort((a, b) => b.duration - a.duration);

	return sortedHoles[0] ?? null;
}

function getAverage(resources: Resource) {
	const totalCoefficient = resources.evaluations.reduce(
		(acc, e) => acc + e.coefficient,
		0
	);

	const totalNote = resources.evaluations.reduce(
		(acc, e) => acc + e.note * e.coefficient,
		0
	);

	return totalNote / totalCoefficient;
}

function getSectionAverage(section: Resource[]) {
	return section
		.map((resource) => getAverage(resource))
		.filter((average) => !isNaN(average))
		.reduce((acc, average, i, arr) => {
			acc += average;
			if (i === arr.length - 1) acc /= arr.length;
			return acc;
		}, 0)
		.toLocaleString("fr-FR", {
			maximumFractionDigits: 2,
			minimumFractionDigits: 2,
		});
}

export default function App() {
	const [planningData, setPlanningData] = useState<Planning>({});
	const [selectedDate, setSelectedDate] = useState(moment());
	const [calendarDeployed, setCalendarDeployed] = useState(false);
	const [dayEvents, setDayEvents] = useState<PlanningEvent[]>([]);
	const [mealEvent, setMealEvent] = useState<MealEvent | null>(null);
	const [semesters, setSemesters] = useState<Semester[]>([]);
	const [selectedSemester, setSelectedSemester] = useState(0);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [fetchingNotes, setFetchingNotes] = useState(false);
	const [auth, setAuth] = useState<Auth | null>(null);
	const [editingPromo, setEditingPromo] = useState(false);
	const [passwordVisible, setPasswordVisible] = useState(false);
	const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
	const [disconnecting, setDisconnecting] = useState(false);
	const [settings, setSettings] = useState(DefaultSettings);
	const [selectedNote, setSelectedNote] = useState<Evaluation | null>(null);
	const [promos, setPromos] = useState<Promos>({});
	const [messages, setMessages] = useState<Message[]>([]);
	const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
	const [lastSeen, setLastSeen] = useState<Moment | null>(null);
	const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

	const [promo, setPromo] = useState<
		({ sector: Sector } | (Promo & { sector: Sector })) | null
	>(null);

	const [image, setImage] = useState<{
		url: string;
		width: number;
		height: number;
	} | null>(null);

	const [noteDistribution, setNoteDistribution] = useState<Distribution | null>(
		null
	);

	const [darkTheme, setDarkTheme] = useState(
		Appearance.getColorScheme() === "dark"
	);

	const [errors, setErrors] = useState<{
		username: string | null;
		password: string | null;
		global: string | null;
	}>({
		username: null,
		password: null,
		global: null,
	});

	function selectMessage(message: Message | null) {
		setSelectedMessage(message);

		if (message && (!lastSeen || moment(message.timestamp).isAfter(lastSeen))) {
			setLastSeen(moment(message.timestamp));
			setItemAsync("last_checked", message.timestamp);
		}
	}

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

	function changeDay(date: Moment) {
		setSelectedDate(date);

		const events = planningData[date.format("YYYY-MM-DD")] ?? [];

		setDayEvents(events);
		setMealEvent(getMealEvent(events));
	}

	async function connect() {
		if (username === "")
			return setErrors({
				username: "Champ requis.",
				password: null,
				global: null,
			});

		if (password === "")
			return setErrors({
				username: null,
				password: "Champ requis.",
				global: null,
			});

		setFetchingNotes(true);
		const [success, semesters] = await fetchNotes(username, password);

		setFetchingNotes(false);

		if (!success) {
			setPassword("");
			return setErrors({
				username: null,
				password: null,
				global: "Identifiant ou mot de passe invalide.",
			});
		}

		await setItemAsync("auth", JSON.stringify({ username, password }));
		setSemesters(semesters);
		setSelectedSemester(getDefaultSemester(semesters));
		setAuth({ username, password });
		setUsername("");
		setPassword("");
		setErrors({
			username: null,
			password: null,
			global: null,
		});
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

	async function toggleNotifications() {
		if (settings.planningNotificationEnabled) {
			const success = await deleteExpoPushToken(expoPushToken!);
			if (!success) return;

			setSettingsValue("planningNotificationEnabled", false);
		} else {
			const token =
				expoPushToken ?? (await registerForPushNotificationsAsync()) ?? null;

			if (!token) return;
			setExpoPushToken(token);

			if (!promo) return;
			console.log((promo as Promo).notificationChannel);
			const success = await postExpoPushToken(
				(promo as Promo).notificationChannel,
				token
			);

			if (!success) return;
			setSettingsValue("planningNotificationEnabled", true);
		}
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

		fetchMessages().then((data) => {
			setMessages(data);
		});

		getItemAsync("auth").then((data) => {
			if (!data) return;
			const auth: Auth = JSON.parse(data);
			setAuth(auth);

			fetchNotes(auth.username, auth.password).then(([success, data]) => {
				if (success) {
					setSemesters(data);
					setSelectedSemester(getDefaultSemester(data));
				} else {
					setAuth(null);
					deleteItemAsync("auth");
				}
			});
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

		getItemAsync("last_checked").then((data) => {
			if (!data) return;
			setLastSeen(moment(data));
		});
	}, [
		setAuth,
		setSemesters,
		setSelectedSemester,
		setPromos,
		setMessages,
		setSettings,
		setExpoPushToken,
		setPlanningData,
		setDayEvents,
		setMealEvent,
		setPromo,
		setLastSeen,
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
							Filière {promo?.sector?.toUpperCase()}
							{(promo as Promo)?.name ? ` - ${(promo as Promo).name}` : ""}
						</Text>
					</View>
				</View>
				<ScrollView
					style={[styles.container, { backgroundColor: getTheme().primary }]}
					horizontal
					pagingEnabled
					scrollEnabled={!selectedMessage}
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
					<View style={styles.page}>
						<View style={styles.subHead}>
							<Text style={styles.subHeadDay}>Paramètres</Text>
						</View>
						<ScrollView>
							<View style={styles.settingContainer}>
								<View style={styles.settingCategoryTitleContainer}>
									<Image
										source={require("./assets/images/color-circle.png")}
										style={styles.settingCategoryTitleIcon}
									/>
									<Text style={styles.settingCategoryTitle}>Apparence</Text>
								</View>
								<View style={styles.settingItem}>
									<Text style={styles.settingItemTitle}>Thème Sombre</Text>
									<Text style={styles.settingItemDescription}>
										(en développement)
									</Text>
									<Switch
										value={darkTheme}
										onChange={() => {
											Appearance.setColorScheme(darkTheme ? "light" : "dark");
											setDarkTheme(!darkTheme);
										}}
										style={styles.settingItemSwitch}
										thumbColor={
											darkTheme ? getTheme().accent : getTheme().lightGray
										}
										trackColor={{
											false: getTheme().light,
											true: getTheme().accentLight,
										}}
									/>
								</View>
								<View style={styles.settingItem}>
									<Text style={styles.settingItemTitle}>Pause déjeuner</Text>
									<Switch
										value={settings.showMealBounds}
										onChange={() =>
											setSettingsValue(
												"showMealBounds",
												!settings.showMealBounds
											)
										}
										style={styles.settingItemSwitch}
										thumbColor={
											settings.showMealBounds
												? getTheme().accent
												: getTheme().lightGray
										}
										trackColor={{
											false: getTheme().light,
											true: getTheme().accentLight,
										}}
									/>
								</View>
							</View>
							<View style={styles.settingContainer}>
								<View style={styles.settingCategoryTitleContainer}>
									<Image
										source={require("./assets/images/notification.png")}
										style={styles.settingCategoryTitleIcon}
									/>
									<Text style={styles.settingCategoryTitle}>Notifications</Text>
								</View>
								<View style={styles.settingItem}>
									<Text style={styles.settingItemTitle}>
										Modifications du planning
									</Text>
									<Switch
										value={settings.planningNotificationEnabled}
										onChange={toggleNotifications}
										style={styles.settingItemSwitch}
										thumbColor={
											settings.planningNotificationEnabled
												? getTheme().accent
												: getTheme().lightGray
										}
										trackColor={{
											false: getTheme().light,
											true: getTheme().accentLight,
										}}
									/>
								</View>
							</View>
							<View style={styles.settingContainer}>
								<View style={styles.settingCategoryTitleContainer}>
									<Image
										source={require("./assets/images/link.png")}
										style={styles.settingCategoryTitleIcon}
									/>
									<Text style={styles.settingCategoryTitle}>Connexion</Text>
								</View>
								<View style={styles.settingItem}>
									<Pressable
										style={styles.settingButton}
										onPress={() => changePlanning()}
									>
										<MaterialIcons
											name="edit-calendar"
											size={18}
											color={getTheme().header}
										/>
										<Text style={styles.settingButtonText}>
											Changer de promotion
										</Text>
									</Pressable>
								</View>
								<View style={styles.settingItem}>
									<Pressable
										style={styles.settingButton}
										onPress={() => setDisconnectModalVisible(true)}
									>
										<MaterialIcons
											name="logout"
											size={18}
											color={getTheme().red}
										/>
										<Text style={styles.settingButtonTextDanger}>
											Déconnexion
										</Text>
									</Pressable>
								</View>
							</View>
							<View style={styles.settingContainer}>
								<View style={styles.settingCategoryTitleContainer}>
									<Image
										source={require("./assets/images/information.png")}
										style={styles.settingCategoryTitleIcon}
									/>
									<Text style={styles.settingCategoryTitle}>Informations</Text>
								</View>
								<View style={styles.settingItem}>
									<Text style={styles.settingItemTitle}>
										Version de l'application
									</Text>
									<Text style={styles.settingItemValue}>
										@{app.expo.version}
									</Text>
								</View>
								<View style={styles.settingItem}>
									<Text style={styles.settingItemTitle}>Développeur</Text>
									<Text style={styles.settingItemValue}>Du Cassoulet</Text>
								</View>
								<View style={styles.settingItem}>
									<Text style={styles.settingItemTitle}>
										Administrateur réseau
									</Text>
									<Text style={styles.settingItemValue}>WonderHunter</Text>
								</View>
								<View style={styles.settingItem}>
									<Text style={styles.settingItemTitle}>Licence</Text>
									<Text style={styles.settingItemValue}>MIT</Text>
								</View>
								<View style={styles.settingItem}>
									<Text style={styles.settingItemTitle}>Code source</Text>
									<Text
										style={styles.settingItemValue}
										onPress={() =>
											Linking.openURL(
												"https://github.com/du-cassoulet/planning-app/tree/master/app"
											)
										}
									>
										du-cassoulet/planning-app
									</Text>
								</View>
								<View style={styles.settingItem}>
									<Text style={styles.settingItemTitle}>Contact</Text>
									<Text
										style={styles.settingItemValue}
										onPress={() =>
											Linking.openURL("mailto:gaston.chenet@etu.u-pec.fr")
										}
									>
										gaston.chenet@etu.u-pec.fr
									</Text>
								</View>
							</View>
						</ScrollView>
					</View>
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
							</View>
						</ScrollView>
					</View>
					{promo?.sector === Sector.Info && (
						<View style={styles.page}>
							{!auth && semesters.length === 0 && (
								<React.Fragment>
									<View style={styles.subHead}>
										<Text style={styles.subHeadDay}>Notes</Text>
									</View>
									<View style={styles.connectionPage}>
										<View style={styles.noteHeader}>
											<Text style={styles.noteHeaderLabel}>Connexion</Text>
											<Text style={styles.meanText}>
												Veuillez entrer vos identifiants pour accéder à vos
												notes.
											</Text>
										</View>
										<View style={styles.form}>
											<View>
												<View style={styles.fieldTitleContainer}>
													<MaterialIcons
														name="person"
														size={16}
														color={getTheme().header80}
													/>
													<Text style={styles.fieldTitle}>Identifiant</Text>
												</View>
												<View style={styles.fieldContainer}>
													<TextInput
														style={styles.fieldInput}
														autoCapitalize="none"
														autoCorrect={false}
														underlineColorAndroid="transparent"
														placeholder="Entrez votre identifiant"
														placeholderTextColor={getTheme().lightGray}
														value={username}
														onChangeText={setUsername}
													/>
												</View>
												{errors.username && (
													<Text style={styles.errorText}>
														{errors.username}
													</Text>
												)}
											</View>
											<View>
												<View style={styles.fieldTitleContainer}>
													<MaterialIcons
														name="lock"
														size={16}
														color={getTheme().header80}
													/>
													<Text style={styles.fieldTitle}>Mot de passe</Text>
												</View>
												<View style={styles.fieldContainer}>
													<TextInput
														style={styles.fieldInput}
														autoCapitalize="none"
														autoCorrect={false}
														underlineColorAndroid="transparent"
														placeholder="Entrez votre mot de passe"
														placeholderTextColor={getTheme().lightGray}
														secureTextEntry={!passwordVisible}
														value={password}
														onChangeText={setPassword}
													/>
													<Pressable
														onPress={() => setPasswordVisible(!passwordVisible)}
														style={styles.passwordVisibility}
													>
														<MaterialIcons
															name={
																passwordVisible
																	? "visibility"
																	: "visibility-off"
															}
															size={20}
															color={getTheme().header80}
														/>
													</Pressable>
												</View>
												{errors.password && (
													<Text style={styles.errorText}>
														{errors.password}
													</Text>
												)}
											</View>
											<RipplePressable
												duration={500}
												rippleColor="#fff3"
												onPress={connect}
												style={styles.connectButton}
											>
												{fetchingNotes && (
													<ActivityIndicator
														size="small"
														color={getTheme().white}
													/>
												)}
												<MaterialIcons
													name="login"
													size={20}
													color={getTheme().white80}
												/>
												<Text style={styles.connectButtonText}>
													Se connecter
												</Text>
											</RipplePressable>
											{errors.global && (
												<Text style={styles.errorText}>{errors.global}</Text>
											)}
										</View>
									</View>
								</React.Fragment>
							)}
							{auth && semesters.length === 0 && (
								<View style={styles.connectionPage}>
									<View style={styles.subHead}>
										<Text style={styles.subHeadDay}>Chargement...</Text>
									</View>
									<View style={styles.loadingContainer}>
										<ActivityIndicator size="large" color={getTheme().accent} />
									</View>
								</View>
							)}
							{semesters.length > 0 && (
								<React.Fragment>
									<View style={styles.subHead}>
										<View style={styles.subHeadDayInfo}>
											<Text style={styles.subHeadDay}>
												Semestre {semesters[selectedSemester].num}
											</Text>
											<Text style={styles.subHeadDayBounds}>
												({semesters[selectedSemester].rank}/
												{semesters[selectedSemester].groupSize} de la promotion)
											</Text>
										</View>
										<View style={styles.subHeadDayInfo}>
											<RipplePressable
												duration={500}
												rippleColor="#0001"
												style={styles.subHeadButton}
												onPress={() =>
													setSelectedSemester(Math.max(selectedSemester - 1, 0))
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
												onPress={() =>
													setSelectedSemester(
														Math.min(selectedSemester + 1, semesters.length - 1)
													)
												}
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
										showsVerticalScrollIndicator={false}
										contentContainerStyle={styles.resourceContainer}
									>
										<View style={styles.noteHeader}>
											<Text style={styles.noteHeaderLabel}>Moyennes</Text>
											<Text style={styles.meanText}>
												Voici vos moyennes pour le semestre{" "}
												{semesters[selectedSemester].num}.
											</Text>
										</View>
										<View style={styles.meanContainer}>
											<View style={styles.userMeanContent}>
												<Text style={styles.userMeanLabel}>
													Moyenne générale
												</Text>
												<Text style={styles.userMeanValue}>
													{semesters[selectedSemester].note.toLocaleString(
														"fr-FR",
														{
															maximumFractionDigits: 2,
															minimumFractionDigits: 2,
														}
													)}
												</Text>
											</View>
											<View style={styles.notesRow}>
												<View style={styles.classMeanContent}>
													<Text style={styles.userMeanLabel}>Maximum</Text>
													<Text style={styles.userMeanValue}>
														{semesters[
															selectedSemester
														].max_note.toLocaleString("fr-FR", {
															maximumFractionDigits: 2,
															minimumFractionDigits: 2,
														})}
													</Text>
												</View>
												<View style={styles.classMeanContent}>
													<Text style={styles.userMeanLabel}>Classe</Text>
													<Text style={styles.userMeanValue}>
														{semesters[selectedSemester].average.toLocaleString(
															"fr-FR",
															{
																maximumFractionDigits: 2,
																minimumFractionDigits: 2,
															}
														)}
													</Text>
												</View>
												<View style={styles.classMeanContent}>
													<Text style={styles.userMeanLabel}>Minimum</Text>
													<Text style={styles.userMeanValue}>
														{semesters[
															selectedSemester
														].min_note.toLocaleString("fr-FR", {
															maximumFractionDigits: 2,
															minimumFractionDigits: 2,
														})}
													</Text>
												</View>
											</View>
										</View>
										<View style={styles.noteHeader}>
											<Text style={styles.noteHeaderLabel}>Matières</Text>
											<Text style={styles.meanText}>
												Moyenne :{" "}
												{getSectionAverage(
													semesters[selectedSemester].resources
												) || "~"}
											</Text>
										</View>
										<View style={styles.classes}>
											{semesters[selectedSemester].resources.map(
												(resource, i) => (
													<View key={i} style={styles.class}>
														<View
															style={[
																styles.classHeader,
																{ backgroundColor: getTheme().blue },
															]}
														>
															<Text style={styles.average}>
																{resource.evaluations.length
																	? getAverage(resource).toLocaleString(
																			"fr-FR",
																			{
																				maximumFractionDigits: 2,
																				minimumFractionDigits: 2,
																			}
																	  )
																	: "~"}
															</Text>
															<Text style={styles.resourceTitle}>
																{resource.title}
															</Text>
														</View>
														<View style={styles.notes}>
															{resource.evaluations.length === 0 && (
																<Text style={styles.noteContent}>
																	Aucune note pour cette matière
																</Text>
															)}
															{resource.evaluations.map((evaluation, j) => (
																<Pressable
																	onPress={() => selectNote(evaluation)}
																	key={j}
																	style={[
																		styles.note,
																		{
																			borderBottomWidth:
																				evaluation.date &&
																				moment(evaluation.date).isSame(
																					moment(),
																					"day"
																				)
																					? 2
																					: 0,
																		},
																	]}
																>
																	<Text
																		style={[
																			styles.noteContent,
																			{
																				fontFamily:
																					evaluation.note < 10
																						? "Rubik-Bold"
																						: "Rubik-Regular",
																			},
																		]}
																	>
																		{evaluation.note.toLocaleString("fr-FR", {
																			maximumFractionDigits: 2,
																			minimumFractionDigits: 0,
																		})}
																	</Text>
																	{evaluation.coefficient !== 1 && (
																		<Text style={styles.coef}>
																			({evaluation.coefficient})
																		</Text>
																	)}
																</Pressable>
															))}
														</View>
													</View>
												)
											)}
										</View>
										<View style={styles.noteHeader}>
											<Text style={styles.noteHeaderLabel}>SAÉ</Text>
											<Text style={styles.meanText}>
												Moyenne :{" "}
												{getSectionAverage(semesters[selectedSemester].saes) ||
													"~"}
											</Text>
										</View>
										<View style={styles.classes}>
											{semesters[selectedSemester].saes.map((resource, i) => (
												<View key={i} style={styles.class}>
													<View
														style={[
															styles.classHeader,
															{ backgroundColor: getTheme().pink },
														]}
													>
														<Text style={styles.average}>
															{resource.evaluations.length
																? getAverage(resource).toLocaleString("fr-FR", {
																		maximumFractionDigits: 2,
																		minimumFractionDigits: 2,
																  })
																: "~"}
														</Text>
														<Text style={styles.resourceTitle}>
															{resource.title}
														</Text>
													</View>
													<View style={styles.notes}>
														{resource.evaluations.length === 0 && (
															<Text style={styles.noteContent}>
																Aucune note pour cette matière
															</Text>
														)}
														{resource.evaluations.map((evaluation, j) => (
															<Pressable
																onPress={() => selectNote(evaluation)}
																key={j}
																style={[
																	styles.note,
																	{
																		borderBottomWidth:
																			evaluation.date &&
																			moment(evaluation.date).isSame(
																				moment(),
																				"day"
																			)
																				? 2
																				: 0,
																	},
																]}
															>
																<Text
																	style={[
																		styles.noteContent,
																		{
																			fontFamily:
																				evaluation.note < 10
																					? "Rubik-Bold"
																					: "Rubik-Regular",
																		},
																	]}
																>
																	{evaluation.note.toLocaleString("fr-FR", {
																		maximumFractionDigits: 2,
																		minimumFractionDigits: 0,
																	})}
																</Text>
																{evaluation.coefficient !== 1 && (
																	<Text style={styles.coef}>
																		({evaluation.coefficient})
																	</Text>
																)}
															</Pressable>
														))}
													</View>
												</View>
											))}
										</View>
									</ScrollView>
								</React.Fragment>
							)}
						</View>
					)}
					{promo?.sector === Sector.Info && auth && (
						<View style={styles.page}>
							<View style={styles.subHead}>
								<View style={styles.subHeadDayInfo}>
									<Text style={styles.subHeadDay}>Informations</Text>
								</View>
							</View>
							<View style={styles.messagesContainer}>
								<ScrollView>
									{messages.map((message, index) => (
										<RipplePressable
											key={index}
											style={[
												styles.messageButton,
												{
													borderTopWidth: index === 0 ? 0 : 1,
												},
											]}
											duration={500}
											rippleColor={
												Appearance.getColorScheme() === "dark"
													? "#fff3"
													: "#0001"
											}
											onPress={() => selectMessage(message)}
										>
											<Image
												source={
													message.author_avatar
														? { uri: message.author_avatar }
														: require("./assets/images/icon.png")
												}
												style={styles.messageAvatar}
											/>
											<View style={styles.messageElement}>
												<View style={styles.messageElementHead}>
													{moment(message.timestamp).isAfter(lastSeen) && (
														<MaterialIcons
															name="circle"
															size={8}
															color={getTheme().accent}
														/>
													)}
													<Text style={styles.messageUsername}>
														{message.author_username}
													</Text>
													<Text style={styles.messageTimestamp}>
														{moment(message.timestamp).format("ddd D MMM")}
													</Text>
												</View>
												{message.content.length > 0 && (
													<Text
														style={styles.messagePreview}
														numberOfLines={3}
														ellipsizeMode="tail"
													>
														{message.content.replace(/\n/g, " ")}
													</Text>
												)}
												{message.attachments.length > 0 && (
													<View
														style={{
															flexDirection: "row",
															gap: 5,
															alignItems: "center",
															marginTop: message.content.length > 0 ? 5 : 0,
														}}
													>
														<FontAwesome6
															name="paperclip"
															size={14}
															color={getTheme().darkGray}
														/>
														<Text
															style={{
																fontFamily: "Rubik-Regular",
																color: getTheme().darkGray,
																fontSize: 12,
															}}
															numberOfLines={3}
															ellipsizeMode="tail"
														>
															{message.attachments.length > 1
																? `${message.attachments.length} pièces jointes`
																: `${message.attachments[0].filename}`}
														</Text>
													</View>
												)}
											</View>
										</RipplePressable>
									))}
								</ScrollView>
								<PageModal
									visible={!!selectedMessage}
									onClose={() => selectMessage(null)}
									head={
										<View style={styles.messageHead}>
											<Image
												source={
													selectedMessage?.author_avatar
														? { uri: selectedMessage?.author_avatar }
														: require("./assets/images/icon.png")
												}
												style={styles.authorAvatar}
											/>
											<View>
												<Text style={styles.messageAuthor}>
													{selectedMessage?.author_username}
												</Text>
												<Text style={styles.messageDate}>
													{moment(selectedMessage?.timestamp).format(
														"dddd Do MMMM YYYY, HH[h]mm"
													)}
												</Text>
											</View>
										</View>
									}
								>
									{selectedMessage && (
										<Hyperlink
											linkStyle={styles.linkStyle}
											linkDefault
											style={styles.messageContainer}
										>
											<Text style={styles.messageContent}>
												{selectedMessage?.content}
											</Text>
										</Hyperlink>
									)}
									<View style={styles.attachments}>
										{selectedMessage?.attachments.map((attachment, i) =>
											attachment.type.startsWith("image/") ? (
												<Pressable
													key={i}
													onPress={() =>
														setImage({
															url: attachment.url,
															height: attachment.height,
															width: attachment.width,
														})
													}
												>
													<Image
														source={{ uri: attachment.url }}
														style={styles.attachmentImage}
														resizeMode="cover"
													/>
												</Pressable>
											) : (
												<RipplePressable
													key={i}
													onPress={() => Linking.openURL(attachment.url)}
													style={styles.attachmentFile}
													duration={500}
													rippleColor={
														Appearance.getColorScheme() === "dark"
															? "#fff1"
															: "#0001"
													}
												>
													<View style={styles.attachmentIcon}>
														{attachment.type.startsWith("application/pdf") ? (
															<FontAwesome6
																name="file-pdf"
																size={20}
																color={getTheme().accent}
															/>
														) : attachment.type.startsWith(
																"application/msword"
														  ) ? (
															<FontAwesome6
																name="file-word"
																size={20}
																color={getTheme().accent}
															/>
														) : (
															<FontAwesome6
																name="file"
																size={20}
																color={getTheme().accent}
															/>
														)}
													</View>
													<View style={styles.attachmentInfo}>
														<Text
															style={styles.attachmentFilename}
															numberOfLines={1}
															ellipsizeMode="tail"
														>
															{attachment.filename}
														</Text>
														<Text style={styles.attachmentSize}>
															{translateSizeToBits(attachment.size)}
														</Text>
													</View>
													<View style={styles.attachmentIcon}>
														<MaterialIcons
															name="download"
															size={24}
															color={getTheme().gray}
														/>
													</View>
												</RipplePressable>
											)
										)}
									</View>
								</PageModal>
							</View>
						</View>
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
	classes: {
		paddingHorizontal: 15,
		paddingBottom: 20,
		gap: 20,
	},
	class: {
		backgroundColor: getTheme().secondary,
		borderRadius: 6,
	},
	classHeader: {
		padding: 10,
		flexDirection: "row",
		gap: 12,
		alignItems: "center",
		borderRadius: 6,
	},
	average: {
		fontSize: 12,
		fontFamily: "Rubik-Regular",
		color: getTheme().black,
		width: 45,
		paddingVertical: 5,
		textAlign: "center",
		backgroundColor: getTheme().white,
		borderRadius: 5,
	},
	notes: {
		paddingVertical: 15,
		paddingHorizontal: 20,
		flexWrap: "wrap",
		flexDirection: "row",
		gap: 25,
	},
	note: {
		flexDirection: "row",
		gap: 5,
		padding: 2,
		borderBottomColor: getTheme().lightBlue,
	},
	noteContent: {
		color: getTheme().header80,
	},
	coef: {
		color: getTheme().gray,
		fontSize: 10,
	},
	resourceTitle: {
		fontSize: 14,
		color: getTheme().white,
		flex: 1,
		fontFamily: "Rubik-Regular",
		lineHeight: 21,
	},
	resourceContainer: {
		gap: 10,
	},
	meanText: {
		fontSize: 12,
		color: getTheme().header80,
		fontFamily: "Rubik-Italic",
	},
	noteHeader: {
		paddingVertical: 15,
		paddingHorizontal: 20,
	},
	noteHeaderLabel: {
		fontSize: 20,
		color: getTheme().header,
		fontFamily: "Rubik-Bold",
	},
	meanContainer: {
		paddingBottom: 15,
		paddingHorizontal: 20,
		gap: 10,
	},
	userMeanContent: {
		flexDirection: "row",
		backgroundColor: getTheme().secondary,
		paddingVertical: 10,
		paddingHorizontal: 15,
		borderRadius: 6,
		alignItems: "center",
	},
	userMeanLabel: {
		fontSize: 14,
		color: getTheme().header80,
		fontFamily: "Rubik-Regular",
		flex: 1,
	},
	userMeanValue: {
		color: getTheme().header,
		fontFamily: "Rubik-Bold",
		fontSize: 14,
	},
	classMeanContent: {
		flex: 1,
		alignItems: "center",
		backgroundColor: getTheme().secondary,
		paddingVertical: 10,
		paddingHorizontal: 15,
		borderRadius: 6,
	},
	notesRow: {
		flexDirection: "row",
		gap: 10,
	},
	connectionPage: {
		flex: 1,
	},
	connectionHead: {
		padding: 15,
	},
	connectButton: {
		paddingVertical: 14,
		marginTop: "auto",
		backgroundColor: getTheme().accent,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 10,
		gap: 10,
	},
	connectButtonText: {
		fontFamily: "Rubik-Bold",
		color: getTheme().white,
	},
	errorText: {
		color: getTheme().red,
		fontSize: 12,
		marginLeft: 5,
	},
	fieldTitle: {
		fontFamily: "Rubik-Regular",
		color: getTheme().header80,
		fontSize: 15,
		marginTop: 2,
	},
	fieldTitleContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 4,
		marginLeft: 8,
		gap: 5,
	},
	fieldContainer: {
		borderWidth: 1,
		borderColor: getTheme().borderColor,
		borderRadius: 10,
		marginBottom: 5,
		flexDirection: "row",
		gap: 5,
	},
	fieldInput: {
		flex: 1,
		fontFamily: "Rubik-Regular",
		paddingHorizontal: 15,
		paddingVertical: 10,
		color: getTheme().header,
	},
	passwordVisibility: {
		alignItems: "center",
		justifyContent: "center",
		marginRight: 15,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	form: {
		flex: 1,
		padding: 15,
		gap: 15,
	},
	dayProgressionLine: {
		position: "absolute",
		backgroundColor: getTheme().blue,
		width: Dimensions.get("window").width,
		height: 2,
		zIndex: 100,
	},
	dayProgressionDot: {
		position: "absolute",
		backgroundColor: getTheme().blue,
		width: 12,
		height: 12,
		borderRadius: 6,
		zIndex: 100,
		left: 50,
		transform: [{ translateY: -5 }, { translateX: -5.5 }],
	},
	settingItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 15,
		gap: 10,
		marginVertical: 8,
	},
	settingItemTitle: {
		fontFamily: "Rubik-Regular",
		color: getTheme().header,
	},
	settingItemDescription: {
		fontFamily: "Rubik-Regular",
		fontSize: 12,
		color: getTheme().lightGray,
	},
	settingItemSwitch: {
		marginLeft: "auto",
		marginTop: -15,
		marginBottom: -15,
	},
	settingCategoryTitle: {
		fontFamily: "Rubik-Bold",
		fontSize: 18,
		color: getTheme().header,
	},
	settingCategoryTitleContainer: {
		padding: 15,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	settingCategoryTitleIcon: {
		width: 20,
		height: 20,
	},
	settingContainer: {
		paddingVertical: 10,
	},
	settingButton: {
		flexDirection: "row",
		gap: 5,
	},
	settingButtonTextDanger: {
		fontFamily: "Rubik-Regular",
		color: getTheme().red,
	},
	settingButtonText: {
		fontFamily: "Rubik-Regular",
		color: getTheme().header,
	},
	settingButtonIcon: {
		width: 20,
		height: 20,
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
	settingItemValue: {
		fontFamily: "Rubik-Regular",
		fontSize: 14,
		color: getTheme().lightGray,
		marginLeft: "auto",
	},
	messageAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
	},
	messageUsername: {
		fontFamily: "Rubik-Bold",
		color: getTheme().header,
	},
	message: {
		flexDirection: "row",
		gap: 20,
	},
	attachmentImage: {
		width: "100%",
		height: 200,
		borderRadius: 10,
	},
	attachments: {
		padding: 15,
		gap: 15,
	},
	messageContent: {
		fontFamily: "Rubik-Regular",
		fontSize: 15,
		lineHeight: 24,
		color: getTheme().header,
	},
	messageContainer: {
		padding: 15,
	},
	messageDate: {
		fontFamily: "Rubik-Regular",
		fontSize: 12,
		color: getTheme().gray,
		textTransform: "capitalize",
	},
	messageAuthor: {
		fontFamily: "Rubik-Bold",
		fontSize: 16,
		color: getTheme().header,
	},
	authorAvatar: {
		height: 40,
		width: 40,
		borderRadius: 20,
	},
	messageHead: {
		flexDirection: "row",
		gap: 15,
		alignItems: "center",
	},
	messagePreview: {
		fontFamily: "Rubik-Regular",
		fontSize: 12,
		color: getTheme().gray,
		flex: 1,
		lineHeight: 20,
	},
	messageTimestamp: {
		fontFamily: "Rubik-Regular",
		fontSize: 10,
		color: getTheme().lightGray,
	},
	messageElement: {
		flex: 1,
	},
	messageButton: {
		gap: 15,
		padding: 20,
		borderTopColor: getTheme().borderColor,
		flexDirection: "row",
	},
	linkStyle: {
		color: getTheme().blue,
	},
	messagesContainer: {
		flex: 1,
	},
	messageElementHead: {
		flexDirection: "row",
		gap: 5,
		alignItems: "center",
	},
	attachmentFile: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: getTheme().planningColor,
		padding: 15,
		gap: 10,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: getTheme().borderColor,
	},
	attachmentInfo: {
		flex: 1,
		gap: 2,
	},
	attachmentFilename: {
		fontFamily: "Rubik-Regular",
		color: getTheme().darkGray,
		flex: 1,
	},
	attachmentSize: {
		fontFamily: "Rubik-Regular",
		color: getTheme().lightGray,
		fontSize: 12,
	},
	attachmentIcon: {
		width: 30,
		height: 30,
		justifyContent: "center",
		alignItems: "center",
	},
});
