import React, { useState, useEffect, useRef, useCallback } from "react";
import {
	ScrollView,
	View,
	Text,
	Linking,
	Image,
	Keyboard,
	Dimensions,
	ActivityIndicator,
	Pressable,
	BackHandler,
	Appearance,
	type ColorSchemeName,
} from "react-native";
import { EventProvider } from "react-native-outside-press";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import moment from "moment";
import "moment/locale/fr";
import app from "./app.json";
import Colors from "./constants/Colors";
import DefaultSettings from "./constants/DefaultSettings";
import Links from "./constants/Links";
import darkMode from "./styles/darkMode";
import lightMode from "./styles/lightMode";
import Information from "./screens/Information";
import Notes from "./screens/Notes";
import Planning from "./screens/Planning";
import Settings from "./screens/Settings";
import ImageVisualizer from "./components/ImageVisualizer";
import BottomModal from "./components/BottomModal";
import RipplePressable from "./components/RipplePressable";
import PageModal from "./components/PageModal";
import Graph from "./components/Graph";
import { fetchPromos, fetchPlanning } from "./api/planning";
import { fetchNoteDistribution } from "./api/notes";
import {
	setExpoPushTokenPlanning,
	setExpoPushTokenInfo,
	deleteExpoPushTokenInfo,
	fetchNotifications,
} from "./api/notifications";
import getMealEvent from "./utils/getMealEvent";
import registerForPushNotificationsAsync from "./utils/registerForPushNotificationsAsync";
import {
	type MealEvent,
	type PlanningEvent,
	type Planning as PlanningType,
	type Promo,
	type Promos,
	Sector,
} from "./types/Planning";
import type { NotificationAction, Notification } from "./types/Notification";
import type { Distribution, Evaluation, Semester } from "./types/Notes";
import type { Message } from "./types/Message";

type Auth = {
	username: string;
	password: string;
};

const DEFAULT_PAGE = 1;

preventAutoHideAsync();
moment.locale("fr");

let alreadyAnimated = false;
let currentPage = DEFAULT_PAGE;

export default function App() {
	const [planningData, setPlanningData] = useState<PlanningType>({});
	const [selectedDate, setSelectedDate] = useState(moment());
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
	const [theme, setTheme] = useState<"light" | "dark" | null>(null);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [styles, setStyles] = useState<any>(null);

	const [pageModals, setPageModals] = useState<{
		message: null | Message;
		ue: boolean;
		notifications: boolean;
	}>({
		message: null,
		notifications: false,
		ue: false,
	});

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

	const pageContainerRef = useRef<ScrollView | null>(null);

	function gotoPage(page: number) {
		pageContainerRef.current?.scrollTo({
			x: Dimensions.get("window").width * page,
			animated: true,
		});
	}

	function executeAction(action: NotificationAction) {
		const [actName, actValue] = action.split(":");

		setPageModals({
			message: null,
			notifications: false,
			ue: false,
		});

		switch (actName) {
			case "TODATE":
				gotoPage(DEFAULT_PAGE);
				setSelectedDate(moment(actValue, "YYYY-MM-DD"));
				break;

			case "TOPAGE":
				gotoPage(parseInt(actValue));
				break;

			default:
				break;
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

		if (expoPushToken) {
			if (settings.planningNotificationEnabled) {
				setExpoPushTokenPlanning(p.notificationChannel, expoPushToken);
			}

			if (settings.infoNotificationEnabled && auth) {
				if (promo!.sector === Sector.Info) {
					setExpoPushTokenInfo(p.notificationChannel, expoPushToken);
				} else {
					deleteExpoPushTokenInfo(expoPushToken);
				}
			}
		}

		fetchPlanning(promo!.sector, p.year, p.campus, p.group).then(
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
		if (expoPushToken) deleteExpoPushTokenInfo(expoPushToken);
	}

	function setSettingsValue(key: keyof typeof DefaultSettings, value: boolean) {
		setSettings({ ...settings, [key]: value });
		setItemAsync("settings", JSON.stringify({ ...settings, [key]: value }));
	}

	function onBackPress() {
		if (currentPage !== DEFAULT_PAGE && pageContainerRef.current) {
			gotoPage(DEFAULT_PAGE);
			return true;
		}

		return false;
	}

	function getSettings(): Promise<typeof DefaultSettings> {
		return new Promise((resolve) => {
			const settings = { ...DefaultSettings };

			getItemAsync("settings")
				.then((data) => {
					if (!data) return resolve(settings);
					resolve({ ...settings, ...JSON.parse(data) });
				})
				.catch(() => {
					resolve(settings);
				});
		});
	}

	function getPromo(): Promise<(Promo & { sector: Sector }) | null> {
		return new Promise((resolve) => {
			getItemAsync("promo")
				.then((data) => {
					if (!data) return resolve(null);
					resolve(JSON.parse(data));
				})
				.catch(() => {
					resolve(null);
				});
		});
	}

	async function getTheme(): Promise<"light" | "dark"> {
		const systemTheme = Appearance.getColorScheme();

		return new Promise((resolve) => {
			getItemAsync("theme")
				.then((data) => {
					resolve((data as ColorSchemeName) ?? systemTheme ?? "light");
				})
				.catch(() => {
					resolve(systemTheme ?? "light");
				});
		});
	}

	function setPageModalValue(
		key: keyof typeof pageModals,
		value: boolean | Message | null
	) {
		setPageModals({ ...pageModals, [key]: value });
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

		getSettings().then(async (settings) => {
			setSettings(settings);

			let token: string | null = null;

			if (
				(settings.planningNotificationEnabled ||
					settings.infoNotificationEnabled) &&
				!expoPushToken
			) {
				token = (await registerForPushNotificationsAsync()) ?? null;
				setExpoPushToken(token);
			}

			if (token) {
				fetchNotifications(token).then((data) => {
					setNotifications(data);
				});
			}

			getPromo().then((promo) => {
				if (!promo) return setEditingPromo(true);
				setPromo(promo);

				if (token) {
					if (settings.planningNotificationEnabled) {
						setExpoPushTokenPlanning(
							(promo as Promo).notificationChannel,
							token
						);
					}

					if (settings.infoNotificationEnabled && auth) {
						if (promo!.sector === Sector.Info) {
							setExpoPushTokenInfo((promo as Promo).notificationChannel, token);
						} else {
							deleteExpoPushTokenInfo(token);
						}
					}
				}

				fetchPlanning(promo.sector, promo.year, promo.campus, promo.group).then(
					([success, data]) => {
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
					}
				);
			});
		});

		BackHandler.addEventListener("hardwareBackPress", onBackPress);

		return () => {
			BackHandler.removeEventListener("hardwareBackPress", onBackPress);
		};
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
		setNotifications,
	]);

	useEffect(() => {
		getTheme().then((theme) => {
			setTheme(theme);
			setStyles(theme === "dark" ? darkMode : lightMode);
		});
	}, [theme]);

	const onLayoutRootView = useCallback(async () => {
		if (fontsLoaded && Object.keys(promos).length > 0 && theme)
			return await hideAsync();
	}, [fontsLoaded, promos, theme]);

	if (!fontsLoaded || Object.keys(promos).length === 0 || !theme) return null;

	return (
		<EventProvider onLayout={onLayoutRootView}>
			<GestureHandlerRootView style={styles.container}>
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
					theme={theme}
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
								<ActivityIndicator size="small" color={Colors.white} />
							)}
							<Text
								style={[styles.modalButtonText, styles.modalButtonDangerText]}
							>
								Déconnection
							</Text>
						</RipplePressable>
						<RipplePressable
							duration={500}
							rippleColor={theme === "dark" ? "#fff1" : "#0001"}
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
					theme={theme}
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
							theme={theme}
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
					theme={theme}
				>
					<ScrollView
						contentContainerStyle={styles.promoSelectorContainer}
						showsVerticalScrollIndicator={false}
					>
						{promo?.sector ? (
							<React.Fragment>
								{promos[promo.sector].map((promo, index) => (
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
													color={Colors[theme].darkGray}
												/>
											</View>
										) : (
											<View style={styles.arrowButtonContainer}>
												<MaterialIcons
													name="arrow-forward"
													size={20}
													color={Colors[theme].light}
												/>
											</View>
										)}
									</Pressable>
								))}
								<Pressable
									style={styles.promoSelector}
									onPress={() => Linking.openURL(Links.DISCORD_SERVER_URL)}
								>
									<Text style={styles.promoText}>Il n'y a pas ma classe</Text>
									<View style={styles.arrowButtonContainer}>
										<MaterialIcons
											name="arrow-forward"
											size={20}
											color={Colors[theme].light}
										/>
									</View>
								</Pressable>
							</React.Fragment>
						) : (
							<React.Fragment>
								{Object.keys(promos).map((sector, index) => (
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
												color={Colors[theme].light}
											/>
										</View>
									</Pressable>
								))}
								<Pressable
									style={styles.promoSelector}
									onPress={() => Linking.openURL(Links.DISCORD_SERVER_URL)}
								>
									<Text style={styles.promoText}>
										Il n'y a pas ma promotion
									</Text>
									<View style={styles.arrowButtonContainer}>
										<MaterialIcons
											name="arrow-forward"
											size={20}
											color={Colors[theme].light}
										/>
									</View>
								</Pressable>
							</React.Fragment>
						)}
					</ScrollView>
				</BottomModal>
				<View style={styles.head}>
					<Pressable onPress={() => gotoPage(DEFAULT_PAGE)}>
						<Image
							source={require("./assets/images/upec.png")}
							style={styles.appIcon}
							resizeMode="center"
						/>
					</Pressable>
					<View style={styles.headText}>
						<Text style={styles.appTitle}>{app.expo.name}</Text>
						<Text style={styles.appDescription}>
							{promo?.sector ? "Filière " + promo?.sector?.toUpperCase() : ""}
							{(promo as Promo)?.name ? ` - ${(promo as Promo).name}` : ""}
						</Text>
					</View>
					<View style={styles.headButtons}>
						<RipplePressable
							style={styles.headButton}
							duration={500}
							rippleColor="#0001"
							onPress={() => setPageModalValue("notifications", true)}
						>
							<MaterialIcons
								name="notifications"
								size={24}
								color={Colors.white}
							/>
						</RipplePressable>
					</View>
				</View>
				<ScrollView
					style={styles.container}
					horizontal
					pagingEnabled
					ref={(ref) => {
						pageContainerRef.current = ref;
						if (alreadyAnimated) return;

						ref?.scrollTo({
							x: Dimensions.get("window").width * DEFAULT_PAGE,
							animated: false,
						});

						alreadyAnimated = true;
					}}
					onScroll={(e) => {
						Keyboard.dismiss();
						setDisconnectModalVisible(false);
						setCalendarDeployed(false);
						if (selectedNote) selectNote(null);
						currentPage = Math.round(
							e.nativeEvent.contentOffset.x / Dimensions.get("window").width
						);
					}}
					scrollEnabled={Object.values(pageModals).every((v) => !v)}
				>
					<Settings
						setDisconnectModalVisible={setDisconnectModalVisible}
						setSettingsValue={setSettingsValue}
						changePlanning={changePlanning}
						settings={settings}
						promo={promo as (Promo & { sector: Sector }) | null}
						expoPushToken={expoPushToken}
						setExpoPushToken={setExpoPushToken}
						theme={theme}
						setTheme={setTheme}
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
						selectedDate={selectedDate}
						setSelectedDate={setSelectedDate}
						theme={theme}
					/>
					{promo?.sector === Sector.Info && (
						<Notes
							promo={promo as (Promo & { sector: Sector }) | null}
							expoPushToken={expoPushToken}
							auth={auth}
							selectNote={selectNote}
							selectedSemester={selectedSemester}
							semesters={semesters}
							setAuth={setAuth}
							setSelectedSemester={setSelectedSemester}
							setSemesters={setSemesters}
							theme={theme}
							UEModalVisible={pageModals.ue}
							setUEModalVisible={(ue) => setPageModalValue("ue", ue)}
							settings={settings}
						/>
					)}
					{promo?.sector === Sector.Info && auth && (
						<Information
							setImage={setImage}
							theme={theme}
							selectedMessage={pageModals.message}
							setSelectedMessage={(message) =>
								setPageModalValue("message", message)
							}
						/>
					)}
				</ScrollView>
				<PageModal
					head={
						<View style={styles.flexBox}>
							<Text style={styles.pageModalTitle}>Notifications</Text>
							{notifications.length ? (
								<Text style={styles.pageModalSubtitle}>
									La dernière notification reçue date de{" "}
									{moment(notifications[0].createdAt).fromNow()}
								</Text>
							) : (
								<Text style={styles.pageModalSubtitle}>
									Vous n'avez reçu aucune notification
								</Text>
							)}
						</View>
					}
					theme={theme}
					visible={pageModals.notifications}
					onClose={() => setPageModalValue("notifications", false)}
					statusBarPadding
				>
					{notifications.map((notif, index) => (
						<RipplePressable
							key={index}
							style={styles.notification}
							duration={500}
							onPress={() => notif.action && executeAction(notif.action)}
							rippleColor={
								notif.action ? (theme === "dark" ? "#fff1" : "#0001") : "#fff0"
							}
						>
							<Ionicons
								name={notif.icon ?? "information-circle"}
								size={32}
								color={Colors[theme].header}
							/>
							<View style={styles.flexBox}>
								<View style={styles.notifHead}>
									<Text style={styles.notificationTitle}>{notif.title}</Text>
									<Text style={styles.notificationDate}>
										{moment(notif.createdAt).diff(moment(), "days") === 0
											? moment(notif.createdAt).fromNow()
											: moment(notif.createdAt).format("DD MMMM, HH[h]mm")}
									</Text>
								</View>
								<Text style={styles.notificationBody}>{notif.body}</Text>
							</View>
						</RipplePressable>
					))}
				</PageModal>
			</GestureHandlerRootView>
		</EventProvider>
	);
}
