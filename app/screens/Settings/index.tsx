import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	Linking,
	ScrollView,
	Image,
	Switch,
	Pressable,
} from "react-native";
import { setItemAsync } from "expo-secure-store";
import { setNotificationHandler } from "expo-notifications";
import { MaterialIcons } from "@expo/vector-icons";
import app from "../../app.json";
import Colors from "../../constants/Colors";
import lightMode from "./styles/lightMode";
import darkMode from "./styles/darkMode";
import {
	deleteExpoPushTokenInfo,
	deleteExpoPushTokenPlanning,
	setExpoPushTokenPlanning as postExpoPushTokenPlanning,
	setExpoPushTokenInfo as postExpoPushTokenInfo,
} from "../../api/notifications";
import registerForPushNotificationsAsync from "../../utils/registerForPushNotificationsAsync";
import type DefaultSettings from "../../constants/DefaultSettings";
import { type Promo, Sector } from "../../types/Planning";

type SettingsProps = {
	settings: typeof DefaultSettings;
	expoPushToken: string | null;
	promo: (Promo & { sector: Sector }) | null;
	setSettingsValue: (key: keyof typeof DefaultSettings, value: boolean) => void;
	setDisconnectModalVisible: (visible: boolean) => void;
	changePlanning: () => void;
	setExpoPushToken: (token: string) => void;
	theme: "light" | "dark";
	setTheme: (theme: "light" | "dark") => void;
};

setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: false,
		shouldSetBadge: true,
	}),
});

export default function Settings({
	settings,
	expoPushToken,
	promo,
	setSettingsValue,
	setDisconnectModalVisible,
	changePlanning,
	setExpoPushToken,
	theme,
	setTheme,
}: SettingsProps) {
	const [styles, setStyles] = useState(lightMode);

	async function toggleNotificationsPlanning() {
		if (settings.planningNotificationEnabled) {
			const success = await deleteExpoPushTokenPlanning(expoPushToken!);
			if (!success) return;

			setSettingsValue("planningNotificationEnabled", false);
		} else {
			const token =
				expoPushToken ?? (await registerForPushNotificationsAsync()) ?? null;

			if (!token) return;
			setExpoPushToken(token);

			if (!promo) return;
			const success = await postExpoPushTokenPlanning(
				promo.notificationChannel,
				token
			);

			if (!success) return;
			setSettingsValue("planningNotificationEnabled", true);
		}
	}

	async function toggleNotificationsInfo() {
		if (settings.infoNotificationEnabled) {
			const success = await deleteExpoPushTokenInfo(expoPushToken!);
			if (!success) return;

			setSettingsValue("infoNotificationEnabled", false);
		} else {
			const token =
				expoPushToken ?? (await registerForPushNotificationsAsync()) ?? null;

			if (!token) return;
			setExpoPushToken(token);

			if (!promo) return;
			const success = await postExpoPushTokenInfo(
				promo.notificationChannel,
				token
			);

			if (!success) return;
			setSettingsValue("infoNotificationEnabled", true);
		}
	}

	function changeTheme(theme: "light" | "dark") {
		setTheme(theme);
		setItemAsync("theme", theme);
	}

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
				<Text style={styles.subHeadDay}>Paramètres</Text>
			</View>
			<ScrollView showsVerticalScrollIndicator={false} bounces={false}>
				<View style={styles.settingContainer}>
					<View style={styles.settingCategoryTitleContainer}>
						<Image
							source={require("../../assets/images/color-circle.png")}
							style={styles.settingCategoryTitleIcon}
						/>
						<Text style={styles.settingCategoryTitle}>Apparence</Text>
					</View>
					<View style={styles.settingItem}>
						<View style={styles.settingItemTextContainer}>
							<Text style={styles.settingItemTitle}>Thème Sombre</Text>
							<Text style={styles.settingItemDescription}>
								Activez le thème sombre pour économiser de la batterie.
							</Text>
						</View>
						<Switch
							value={theme === "dark"}
							onChange={() => changeTheme(theme === "dark" ? "light" : "dark")}
							style={styles.settingItemSwitch}
							thumbColor={
								theme === "dark" ? Colors.accent : Colors.light.lightGray
							}
							trackColor={{
								false: Colors[theme].light,
								true: Colors.accentLight,
							}}
						/>
					</View>
					<View style={styles.settingItem}>
						<View style={styles.settingItemTextContainer}>
							<Text style={styles.settingItemTitle}>Pause déjeuner</Text>
							<Text style={styles.settingItemDescription}>
								Afficher les heures de pause déjeuner.
							</Text>
						</View>
						<Switch
							value={settings.showMealBounds}
							onChange={() =>
								setSettingsValue("showMealBounds", !settings.showMealBounds)
							}
							style={styles.settingItemSwitch}
							thumbColor={
								settings.showMealBounds
									? Colors.accent
									: Colors[theme].lightGray
							}
							trackColor={{
								false: Colors[theme].light,
								true: Colors.accentLight,
							}}
						/>
					</View>
					<View style={styles.settingItem}>
						<View style={styles.settingItemTextContainer}>
							<Text style={styles.settingItemTitle}>Indiquer l'heure</Text>
							<Text style={styles.settingItemDescription}>
								Indiquer l'heure sur le planning.
							</Text>
						</View>
						<Switch
							value={settings.hourIndicatorEnabled}
							onChange={() =>
								setSettingsValue(
									"hourIndicatorEnabled",
									!settings.hourIndicatorEnabled
								)
							}
							style={styles.settingItemSwitch}
							thumbColor={
								settings.hourIndicatorEnabled
									? Colors.accent
									: Colors[theme].lightGray
							}
							trackColor={{
								false: Colors[theme].light,
								true: Colors.accentLight,
							}}
						/>
					</View>
					{promo?.sector === "info" && (
						<View style={styles.settingItem}>
							<View style={styles.settingItemTextContainer}>
								<Text style={styles.settingItemTitle}>
									Trier les catégories de notes
								</Text>
								<Text style={styles.settingItemDescription}>
									Montrer seulement les catégories de notes qui contiennent des
									notes.
								</Text>
							</View>
							<Switch
								value={settings.filterNoteset}
								onChange={() =>
									setSettingsValue("filterNoteset", !settings.filterNoteset)
								}
								style={styles.settingItemSwitch}
								thumbColor={
									settings.filterNoteset
										? Colors.accent
										: Colors[theme].lightGray
								}
								trackColor={{
									false: Colors[theme].light,
									true: Colors.accentLight,
								}}
							/>
						</View>
					)}
					<View style={styles.settingItem}>
						<View style={styles.settingItemTextContainer}>
							<Text style={styles.settingItemTitle}>
								Indicateur d'évaluation
							</Text>
							<Text style={styles.settingItemDescription}>
								Montrer quand un cours est une évaluation.
							</Text>
						</View>
						<Switch
							value={settings.showControls}
							onChange={() =>
								setSettingsValue("showControls", !settings.showControls)
							}
							style={styles.settingItemSwitch}
							thumbColor={
								settings.showControls ? Colors.accent : Colors[theme].lightGray
							}
							trackColor={{
								false: Colors[theme].light,
								true: Colors.accentLight,
							}}
						/>
					</View>
				</View>
				<View style={styles.settingContainer}>
					<View style={styles.settingCategoryTitleContainer}>
						<Image
							source={require("../../assets/images/notification.png")}
							style={styles.settingCategoryTitleIcon}
						/>
						<Text style={styles.settingCategoryTitle}>Notifications</Text>
					</View>
					<View style={styles.settingItem}>
						<View style={styles.settingItemTextContainer}>
							<Text style={styles.settingItemTitle}>
								Modifications du planning
							</Text>
							<Text style={styles.settingItemDescription}>
								Recevoir une notification lorsqu'un cours est ajouté, supprimé
								ou modifié.
							</Text>
						</View>
						<Switch
							value={settings.planningNotificationEnabled}
							onChange={toggleNotificationsPlanning}
							style={styles.settingItemSwitch}
							thumbColor={
								settings.planningNotificationEnabled
									? Colors.accent
									: Colors[theme].lightGray
							}
							trackColor={{
								false: Colors[theme].light,
								true: Colors.accentLight,
							}}
						/>
					</View>
					{promo?.sector === Sector.Info && (
						<View style={styles.settingItem}>
							<View style={styles.settingItemTextContainer}>
								<Text style={styles.settingItemTitle}>
									Nouvelles informations
								</Text>
								<Text style={styles.settingItemDescription}>
									Recevoir des notifications pour les nouvelles informations
									importantes.
								</Text>
							</View>
							<Switch
								value={settings.infoNotificationEnabled}
								onChange={toggleNotificationsInfo}
								style={styles.settingItemSwitch}
								thumbColor={
									settings.infoNotificationEnabled
										? Colors.accent
										: Colors[theme].lightGray
								}
								trackColor={{
									false: Colors[theme].light,
									true: Colors.accentLight,
								}}
							/>
						</View>
					)}
				</View>
				<View style={styles.settingContainer}>
					<View style={styles.settingCategoryTitleContainer}>
						<Image
							source={require("../../assets/images/link.png")}
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
								color={Colors[theme].header}
							/>
							<Text style={styles.settingButtonText}>Changer de promotion</Text>
						</Pressable>
					</View>
					<View style={styles.settingItem}>
						<Pressable
							style={styles.settingButton}
							onPress={() => setDisconnectModalVisible(true)}
						>
							<MaterialIcons name="logout" size={18} color={Colors.red} />
							<Text style={styles.settingButtonTextDanger}>Déconnexion</Text>
						</Pressable>
					</View>
				</View>
				<View style={styles.settingContainer}>
					<View style={styles.settingCategoryTitleContainer}>
						<Image
							source={require("../../assets/images/information.png")}
							style={styles.settingCategoryTitleIcon}
						/>
						<Text style={styles.settingCategoryTitle}>Informations</Text>
					</View>
					<View style={styles.settingItem}>
						<Text style={styles.settingItemTitle}>
							Version de l'application
						</Text>
						<Text style={styles.settingItemValue}>@{app.expo.version}</Text>
					</View>
					<View style={styles.settingItem}>
						<Text style={styles.settingItemTitle}>Développeur</Text>
						<Text style={styles.settingItemValue}>Du Cassoulet</Text>
					</View>
					<View style={styles.settingItem}>
						<Text style={styles.settingItemTitle}>Administrateur réseau</Text>
						<Text style={styles.settingItemValue}>WonderHunter</Text>
					</View>
					<View style={styles.settingItem}>
						<Text style={styles.settingItemTitle}>Licence</Text>
						<Text style={styles.settingItemValue}>MIT</Text>
					</View>
					<View style={styles.settingItem}>
						<Text style={styles.settingItemTitle}>Serveur Discord</Text>
						<Text
							style={styles.settingItemValue}
							onPress={() =>
								Linking.canOpenURL("discord://").then((supported) => {
									if (supported) {
										Linking.openURL("discord://discord.gg/qNpDZkAdfN");
									} else {
										Linking.openURL("https://discord.gg/qNpDZkAdfN");
									}
								})
							}
						>
							discord.gg/qNpDZkAdfN
						</Text>
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
	);
}
