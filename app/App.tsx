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
	Switch,
	ActivityIndicator,
	Pressable,
	Keyboard,
} from "react-native";
import { EventProvider } from "react-native-outside-press";
import { MaterialIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import type { MealEvent, Planning, PlanningEvent } from "./types/Planning";
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
import { Resource, Semester, Evaluation } from "./types/Notes";
import fetchNotes from "./utils/fetchNotes";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import app from "./app.json";
import BottomModal from "./components/BottomModal";

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
const MAX_MEAL_TIME = 14;
const MIN_MEAL_DURATION = 30;
const DEFAULT_PAGE = 1;

const DefaultSettings = Object.freeze({
	showDayIndicator: true,
	showMealBounds: true,
});

preventAutoHideAsync();
moment.locale("fr");

let alreadyAnimated = false;

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
	const [time, setTime] = useState(moment());
	const [selectedDate, setSelectedDate] = useState(moment());
	const [calendarDeployed, setCalendarDeployed] = useState(false);
	const [dayEvents, setDayEvents] = useState<PlanningEvent[]>([]);
	const [mealEvent, setMealEvent] = useState<MealEvent | null>(null);
	const [semesters, setSemesters] = useState<Semester[]>([]);
	const [selectedSemester, setSelectedSemester] = useState(0);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [fetchingNotes, setFetchingNotes] = useState(false);
	const [hasAuth, setHasAuth] = useState(false);
	const [passwordVisible, setPasswordVisible] = useState(false);
	const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
	const [disconnecting, setDisconnecting] = useState(false);
	const [settings, setSettings] = useState(DefaultSettings);
	const [selectedNote, setSelectedNote] = useState<Evaluation | null>(null);
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
		setHasAuth(true);
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
		setHasAuth(false);
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
		getItemAsync("auth").then((data) => {
			if (!data) return;
			setHasAuth(true);
			const auth: Auth = JSON.parse(data);

			fetchNotes(auth.username, auth.password).then(([success, data]) => {
				if (success) {
					setSemesters(data);
					setSelectedSemester(getDefaultSemester(data));
				} else {
					setHasAuth(false);
					deleteItemAsync("auth");
				}
			});
		});

		getItemAsync("settings").then((data) => {
			if (!data) return;
			setSettings(JSON.parse(data));
		});

		fetchPlanning().then((data) => {
			setPlanningData(data);

			const events = data[moment().format("YYYY-MM-DD")] ?? [];

			setDayEvents(events);
			setMealEvent(getMealEvent(events));
		});

		const interval = setInterval(() => setTime(moment()), 1000);
		return () => clearInterval(interval);
	}, []);

	const onLayoutRootView = useCallback(async () => {
		if (fontsLoaded) return await hideAsync();
	}, [fontsLoaded]);

	if (!fontsLoaded) return null;

	return (
		<EventProvider onLayout={onLayoutRootView}>
			<GestureHandlerRootView style={styles.container}>
				<StatusBar style="light" />
				<BottomModal
					title="Déconnection"
					visible={disconnectModalVisible}
					setVisible={setDisconnectModalVisible}
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
							rippleColor="#0001"
							style={styles.modalButton}
							onPress={() => setDisconnectModalVisible(false)}
						>
							<Text style={styles.modalButtonText}>Annuler</Text>
						</RipplePressable>
					</View>
				</BottomModal>
				<BottomModal
					title={selectedNote?.title ?? "Note"}
					visible={!!selectedNote}
					setVisible={() => setSelectedNote(null)}
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
					<Text style={styles.dateText}>
						{selectedNote?.date
							? moment(selectedNote.date).format("ddd d MMM YYYY, HH[h]mm")
							: "Date non renseignée"}
					</Text>
				</BottomModal>
				<View style={styles.head}>
					<Image
						source={require("./assets/images/icon.png")}
						style={styles.appIcon}
					/>
					<View style={styles.headText}>
						<Text style={styles.appTitle}>{app.expo.name}</Text>
						<Text style={styles.appDescription}>Filière informatique</Text>
					</View>
				</View>
				<ScrollView
					style={styles.container}
					showsHorizontalScrollIndicator={false}
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
						setSelectedNote(null);
					}}
				>
					<View style={styles.page}>
						<View style={styles.subHead}>
							<Text style={styles.subHeadDay}>Paramètres</Text>
						</View>
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
								<Text style={styles.settingItemTitle}>Indicateur de jour</Text>
								<Switch
									value={settings.showDayIndicator}
									onChange={() =>
										setSettingsValue(
											"showDayIndicator",
											!settings.showDayIndicator
										)
									}
									style={styles.settingItemSwitch}
									thumbColor={
										settings.showDayIndicator
											? getTheme().accent
											: getTheme().lightGray
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
										setSettingsValue("showMealBounds", !settings.showMealBounds)
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
									source={require("./assets/images/link.png")}
									style={styles.settingCategoryTitleIcon}
								/>
								<Text style={styles.settingCategoryTitle}>Connexion</Text>
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
										<Text style={styles.room}>{event.location}</Text>
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
								{settings.showDayIndicator &&
									time.isSame(selectedDate, "day") && (
										<React.Fragment>
											<View
												style={[
													styles.dayProgressionLine,
													{
														top:
															(moment().diff(time.startOf("day"), "seconds") /
																60000 -
																PLANNING_START) *
															100,
													},
												]}
											/>
											<View
												style={[
													styles.dayProgressionDot,
													{
														top:
															(moment().diff(time.startOf("day"), "seconds") /
																60000 -
																PLANNING_START) *
															100,
													},
												]}
											/>
										</React.Fragment>
									)}
							</View>
						</ScrollView>
					</View>
					<View style={styles.page}>
						{!hasAuth && semesters.length === 0 && (
							<React.Fragment>
								<View style={styles.subHead}>
									<Text style={styles.subHeadDay}>Notes</Text>
								</View>
								<View style={styles.connectionPage}>
									<View style={styles.noteHeader}>
										<Text style={styles.noteHeaderLabel}>Connection</Text>
										<Text style={styles.meanText}>
											Veuillez entrer vos identifiants pour accéder à vos notes.
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
												<Text style={styles.errorText}>{errors.username}</Text>
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
															passwordVisible ? "visibility" : "visibility-off"
														}
														size={20}
														color={getTheme().header80}
													/>
												</Pressable>
											</View>
											{errors.password && (
												<Text style={styles.errorText}>{errors.password}</Text>
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
											<Text style={styles.connectButtonText}>Se connecter</Text>
										</RipplePressable>
										{errors.global && (
											<Text style={styles.errorText}>{errors.global}</Text>
										)}
									</View>
								</View>
							</React.Fragment>
						)}
						{hasAuth && semesters.length === 0 && (
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
											<Text style={styles.userMeanLabel}>Moyenne générale</Text>
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
													{semesters[selectedSemester].max_note.toLocaleString(
														"fr-FR",
														{
															maximumFractionDigits: 2,
															minimumFractionDigits: 2,
														}
													)}
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
													{semesters[selectedSemester].min_note.toLocaleString(
														"fr-FR",
														{
															maximumFractionDigits: 2,
															minimumFractionDigits: 2,
														}
													)}
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
																onPress={() => setSelectedNote(evaluation)}
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
															onPress={() => setSelectedNote(evaluation)}
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
	},
	evalItemLabel: {
		fontFamily: "Rubik-Bold",
		color: getTheme().gray,
		fontSize: 12,
		textTransform: "uppercase",
	},
});
