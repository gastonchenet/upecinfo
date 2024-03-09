import React, { useState } from "react";
import {
	StyleSheet,
	View,
	Text,
	Linking,
	ScrollView,
	Image,
	Switch,
	Pressable,
	Dimensions,
	Appearance,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import getTheme from "../utils/getTheme";
import app from "../app.json";
import {
	deleteExpoPushToken,
	setExpoPushToken as postExpoPushToken,
} from "../utils/notifications";
import registerForPushNotificationsAsync from "../utils/registerForPushNotificationsAsync";
import type { Promo } from "../types/Planning";
import { setNotificationHandler } from "expo-notifications";
import type DefaultSettings from "../constants/DefaultSettings";

type SettingsProps = {
	settings: typeof DefaultSettings;
	expoPushToken: string | null;
	promo: Promo | null;
	setSettingsValue: (key: keyof typeof DefaultSettings, value: boolean) => void;
	setDisconnectModalVisible: (visible: boolean) => void;
	changePlanning: () => void;
	setExpoPushToken: (token: string) => void;
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
}: SettingsProps) {
	const [darkTheme, setDarkTheme] = useState(
		Appearance.getColorScheme() === "dark"
	);

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
			const success = await postExpoPushToken(promo.notificationChannel, token);

			if (!success) return;
			setSettingsValue("planningNotificationEnabled", true);
		}
	}

	return (
		<View style={styles.page}>
			<View style={styles.subHead}>
				<Text style={styles.subHeadDay}>Paramètres</Text>
			</View>
			<ScrollView showsVerticalScrollIndicator={false} bounces={false}>
				<View style={styles.settingContainer}>
					<View style={styles.settingCategoryTitleContainer}>
						<Image
							source={require("../assets/images/color-circle.png")}
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
							thumbColor={darkTheme ? getTheme().accent : getTheme().lightGray}
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
					<View style={styles.settingItem}>
						<Text style={styles.settingItemTitle}>Indiquer l'heure</Text>
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
							source={require("../assets/images/notification.png")}
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
							source={require("../assets/images/link.png")}
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
							<Text style={styles.settingButtonText}>Changer de promotion</Text>
						</Pressable>
					</View>
					<View style={styles.settingItem}>
						<Pressable
							style={styles.settingButton}
							onPress={() => setDisconnectModalVisible(true)}
						>
							<MaterialIcons name="logout" size={18} color={getTheme().red} />
							<Text style={styles.settingButtonTextDanger}>Déconnexion</Text>
						</Pressable>
					</View>
				</View>
				<View style={styles.settingContainer}>
					<View style={styles.settingCategoryTitleContainer}>
						<Image
							source={require("../assets/images/information.png")}
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

const styles = StyleSheet.create({
	page: {
		flex: 1,
		width: Dimensions.get("window").width,
	},
	subHead: {
		paddingHorizontal: 15,
		height: 45,
		backgroundColor: getTheme().accentDark,
		alignItems: "center",
		justifyContent: "space-between",
		flexDirection: "row",
	},
	subHeadDay: {
		textTransform: "capitalize",
		color: getTheme().white,
		fontSize: 16,
		fontFamily: "Rubik-Bold",
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
	settingItemValue: {
		fontFamily: "Rubik-Regular",
		fontSize: 14,
		color: getTheme().lightGray,
		marginLeft: "auto",
	},
});
