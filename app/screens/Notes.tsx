import React, { useEffect, useState } from "react";
import {
	StyleSheet,
	View,
	Text,
	ScrollView,
	TextInput,
	ActivityIndicator,
	Pressable,
	Dimensions,
} from "react-native";
import getTheme from "../utils/getTheme";
import { Evaluation, Resource, Semester } from "../types/Notes";
import { MaterialIcons } from "@expo/vector-icons";
import RipplePressable from "../components/RipplePressable";
import moment from "moment";
import "moment/locale/fr";
import fetchNotes from "../utils/fetchNotes";
import { setItemAsync, getItemAsync, deleteItemAsync } from "expo-secure-store";

type Auth = {
	username: string;
	password: string;
};

type NotesProps = {
	setSemesters: (semesters: Semester[]) => void;
	semesters: Semester[];
	selectNote: (note: Evaluation) => void;
	auth: Auth | null;
	setAuth: (auth: Auth | null) => void;
	selectedSemester: number;
	setSelectedSemester: (semester: number) => void;
};

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

function getDefaultSemester(semesters: Semester[]) {
	const now = moment();
	const semester = semesters.find((s) => now.isBetween(s.startDate, s.endDate));
	if (!semester) return 0;

	return semesters.indexOf(semester);
}

export default function Notes({
	setSemesters,
	semesters,
	selectNote,
	auth,
	setAuth,
	selectedSemester,
	setSelectedSemester,
}: NotesProps) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [fetchingNotes, setFetchingNotes] = useState(false);
	const [passwordVisible, setPasswordVisible] = useState(false);

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

	useEffect(() => {
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
	}, []);

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
											name={passwordVisible ? "visibility" : "visibility-off"}
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
									<ActivityIndicator size="small" color={getTheme().white} />
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
						</View>
						<View style={styles.noteHeader}>
							<Text style={styles.noteHeaderLabel}>Matières</Text>
							<Text style={styles.meanText}>
								Moyenne :{" "}
								{getSectionAverage(semesters[selectedSemester].resources) ||
									"~"}
							</Text>
						</View>
						<View style={styles.classes}>
							{semesters[selectedSemester].resources.map((resource, i) => (
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
										<Text style={styles.resourceTitle}>{resource.title}</Text>
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
															moment(evaluation.date).isSame(moment(), "day")
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
						<View style={styles.noteHeader}>
							<Text style={styles.noteHeaderLabel}>SAÉ</Text>
							<Text style={styles.meanText}>
								Moyenne :{" "}
								{getSectionAverage(semesters[selectedSemester].saes) || "~"}
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
										<Text style={styles.resourceTitle}>{resource.title}</Text>
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
															moment(evaluation.date).isSame(moment(), "day")
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
});
