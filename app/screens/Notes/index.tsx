import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	ScrollView,
	TextInput,
	ActivityIndicator,
	Pressable,
	StatusBar,
} from "react-native";
import { setItemAsync, getItemAsync, deleteItemAsync } from "expo-secure-store";
import { MaterialIcons } from "@expo/vector-icons";
import moment from "moment";
import "moment/locale/fr";
import Colors from "../../constants/Colors";
import lightMode from "./styles/lightMode";
import darkMode from "./styles/darkMode";
import RipplePressable from "../../components/RipplePressable";
import PageModal from "../../components/PageModal";
import { fetchNotes } from "../../api/notes";
import { setExpoPushTokenInfo } from "../../api/notifications";
import type DefaultSettings from "../../constants/DefaultSettings";
import type { Evaluation, Resource, Semester } from "../../types/Notes";
import type { Promo } from "../../types/Planning";

type Auth = {
	username: string;
	password: string;
};

type NotesProps = {
	promo: Promo | null;
	expoPushToken: string | null;
	setSemesters: (semesters: Semester[]) => void;
	semesters: Semester[];
	selectNote: (note: Evaluation) => void;
	auth: Auth | null;
	setAuth: (auth: Auth | null) => void;
	selectedSemester: number;
	setSelectedSemester: (semester: number) => void;
	theme: "light" | "dark";
	UEModalVisible: boolean;
	setUEModalVisible: (visible: boolean) => void;
	settings: typeof DefaultSettings;
};

function getAverage(resources: Resource) {
	const totalCoefficient = resources.evaluations.reduce(
		(acc, e) => acc + (e.note !== null && !isNaN(e.note) ? e.coefficient : 0),
		0
	);

	const totalNote = resources.evaluations
		.filter((e) => e.note !== null && !isNaN(e.note))
		.reduce((acc, e) => acc + e.note * e.coefficient, 0);

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

function getDefaultSemester(semesters: Semester[]) {
	const now = moment();
	const semester = semesters.find((s) => now.isBetween(s.startDate, s.endDate));
	if (!semester) return 0;

	return semesters.indexOf(semester);
}

export default function Notes({
	promo,
	expoPushToken,
	setSemesters,
	semesters,
	selectNote,
	auth,
	setAuth,
	selectedSemester,
	setSelectedSemester,
	theme,
	UEModalVisible,
	setUEModalVisible,
	settings,
}: NotesProps) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [fetchingNotes, setFetchingNotes] = useState(false);
	const [passwordVisible, setPasswordVisible] = useState(false);
	const [styles, setStyles] = useState(lightMode);

	const [errors, setErrors] = useState<{
		username: string | null;
		password: string | null;
		global: string | null;
	}>({
		username: null,
		password: null,
		global: null,
	});

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

		if (expoPushToken && settings.infoNotificationEnabled) {
			setExpoPushTokenInfo((promo as Promo).notificationChannel, expoPushToken);
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

	function getAuth(): Promise<Auth | null> {
		return new Promise((resolve) => {
			getItemAsync("auth")
				.then((data) => {
					if (!data) return resolve(null);
					resolve(JSON.parse(data));
				})
				.catch(() => {
					resolve(null);
				});
		});
	}

	useEffect(() => {
		getAuth().then((auth) => {
			if (!auth) return;
			setAuth(auth);

			if (expoPushToken && settings.infoNotificationEnabled && auth) {
				setExpoPushTokenInfo(
					(promo as Promo).notificationChannel,
					expoPushToken
				);
			}

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
	}, []);

	useEffect(() => {
		if (theme === "dark") {
			setStyles(darkMode);
		} else {
			setStyles(lightMode);
		}
	}, [theme]);

	return (
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
								Veuillez entrer vos identifiants pour accéder à vos notes.
							</Text>
						</View>
						<View style={styles.form}>
							<View>
								<View style={styles.fieldTitleContainer}>
									<MaterialIcons
										name="person"
										size={16}
										color={Colors[theme].header80}
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
										placeholderTextColor={Colors[theme].lightGray}
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
										color={Colors[theme].header80}
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
										placeholderTextColor={Colors[theme].lightGray}
										secureTextEntry={!passwordVisible}
										value={password}
										onChangeText={setPassword}
									/>
									<Pressable
										onPress={() => setPasswordVisible(!passwordVisible)}
										style={styles.passwordVisibility}
									>
										<MaterialIcons
											name={passwordVisible ? "visibility" : "visibility-off"}
											size={20}
											color={Colors[theme].header80}
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
									<ActivityIndicator size="small" color={Colors.white} />
								)}
								<MaterialIcons name="login" size={20} color={Colors.white80} />
								<Text style={styles.connectButtonText}>Se connecter</Text>
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
						<ActivityIndicator size="large" color={Colors.accent} />
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
									color={Colors.white}
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
									color={Colors.white}
								/>
							</RipplePressable>
						</View>
					</View>
					<View>
						<ScrollView
							showsVerticalScrollIndicator={false}
							contentContainerStyle={styles.resourceContainer}
							style={styles.resourceScroll}
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
										{semesters[selectedSemester].note.toLocaleString("fr-FR", {
											maximumFractionDigits: 2,
											minimumFractionDigits: 2,
										})}
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
								<RipplePressable
									rippleColor="#fff1"
									duration={500}
									style={styles.ueButton}
									onPress={() => setUEModalVisible(true)}
								>
									<MaterialIcons name="book" size={20} color={Colors.white80} />
									<Text style={styles.ueButtonText}>
										Voir mes UE du semestre {semesters[selectedSemester].num}
									</Text>
									<MaterialIcons
										name="keyboard-arrow-right"
										size={20}
										color={Colors.white80}
									/>
								</RipplePressable>
							</View>
							{semesters[selectedSemester].resources.reduce(
								(acc, resource) => acc + resource.evaluations.length,
								0
							) > 0 && (
								<React.Fragment>
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
										{semesters[selectedSemester].resources
											.filter(
												(resource) =>
													!settings.filterNoteset ||
													resource.evaluations.length > 0
											)
											.map((resource, i) => (
												<View key={i} style={styles.class}>
													<View
														style={[
															styles.classHeader,
															{ backgroundColor: Colors.blue },
														]}
													>
														<Text style={styles.average}>
															{resource.evaluations.length
																? isNaN(getAverage(resource))
																	? "~"
																	: getAverage(resource).toLocaleString(
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
																	{evaluation.note?.toLocaleString("fr-FR", {
																		maximumFractionDigits: 2,
																		minimumFractionDigits: 0,
																	}) ?? "ABS"}
																</Text>
																{evaluation.coefficient !== 1 && (
																	<Text style={styles.coef}>
																		(
																		{evaluation.coefficient.toLocaleString(
																			"fr-FR",
																			{
																				maximumFractionDigits: 2,
																				minimumFractionDigits: 0,
																			}
																		)}
																		)
																	</Text>
																)}
															</Pressable>
														))}
													</View>
												</View>
											))}
									</View>
								</React.Fragment>
							)}
							{semesters[selectedSemester].saes.reduce(
								(acc, sae) => acc + sae.evaluations.length,
								0
							) > 0 && (
								<React.Fragment>
									<View style={styles.noteHeader}>
										<Text style={styles.noteHeaderLabel}>SAÉ</Text>
										<Text style={styles.meanText}>
											Moyenne :{" "}
											{getSectionAverage(semesters[selectedSemester].saes) ||
												"~"}
										</Text>
									</View>
									<View style={styles.classes}>
										{semesters[selectedSemester].saes
											.filter(
												(sae) =>
													!settings.filterNoteset || sae.evaluations.length > 0
											)
											.map((resource, i) => (
												<View key={i} style={styles.class}>
													<View
														style={[
															styles.classHeader,
															{ backgroundColor: Colors.pink },
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
																	{evaluation.note?.toLocaleString("fr-FR", {
																		maximumFractionDigits: 2,
																		minimumFractionDigits: 0,
																	}) ?? "ABS"}
																</Text>
																{evaluation.coefficient !== 1 && (
																	<Text style={styles.coef}>
																		(
																		{evaluation.coefficient.toLocaleString(
																			"fr-FR",
																			{
																				maximumFractionDigits: 2,
																				minimumFractionDigits: 0,
																			}
																		)}
																		)
																	</Text>
																)}
															</Pressable>
														))}
													</View>
												</View>
											))}
									</View>
								</React.Fragment>
							)}
						</ScrollView>
						<PageModal
							theme={theme}
							head={
								<View>
									<Text style={styles.pageModalTitle}>
										UE du semestre {semesters[selectedSemester].num}
									</Text>
									<Text style={styles.pageModalSubtitle}>
										{moment(semesters[selectedSemester].startDate).format(
											"MMMM YYYY"
										)}{" "}
										-{" "}
										{moment(semesters[selectedSemester].endDate).format(
											"MMMM YYYY"
										)}
									</Text>
								</View>
							}
							visible={UEModalVisible}
							onClose={() => setUEModalVisible(false)}
						>
							<View
								style={[
									styles.classes,
									{ marginBottom: StatusBar.currentHeight! },
								]}
							>
								{semesters[selectedSemester].ues
									.filter(
										(ue) => !settings.filterNoteset || ue.evaluations.length > 0
									)
									.map((ue, i) => (
										<View key={i} style={styles.class}>
											<View
												style={[
													styles.classHeader,
													{
														backgroundColor:
															ue.average < 10 ? Colors.red : Colors.green,
													},
												]}
											>
												<View style={styles.average}>
													<Text style={styles.averageValue}>
														{ue.average.toLocaleString("fr-FR", {
															maximumFractionDigits: 2,
															minimumFractionDigits: 2,
														})}
													</Text>
													<Text style={styles.averageSubValue}>
														{ue.rank}/{ue.groupSize}
													</Text>
												</View>
												<View style={styles.headText}>
													<Text style={styles.resourceTitle}>{ue.title}</Text>
													<Text style={styles.resourceResult}>
														{ue.note < 10 ? "Ajourné" : "Admis"}
													</Text>
												</View>
											</View>
											<View style={styles.notes}>
												{ue.evaluations.length === 0 && (
													<Text style={styles.noteContent}>
														Aucune note pour cette matière
													</Text>
												)}
												{ue.evaluations.map((evaluation, j) => (
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
															{evaluation.note?.toLocaleString("fr-FR", {
																maximumFractionDigits: 2,
																minimumFractionDigits: 0,
															}) ?? "ABS"}
														</Text>
														{evaluation.coefficient !== 1 && (
															<Text style={styles.coef}>
																(
																{evaluation.coefficient.toLocaleString(
																	"fr-FR",
																	{
																		maximumFractionDigits: 2,
																		minimumFractionDigits: 0,
																	}
																)}
																)
															</Text>
														)}
													</Pressable>
												))}
											</View>
										</View>
									))}
							</View>
						</PageModal>
					</View>
				</React.Fragment>
			)}
		</View>
	);
}
