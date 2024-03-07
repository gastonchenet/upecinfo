import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import type { Distribution } from "../types/Notes";
import getTheme from "../utils/getTheme";

const GAP = 5;

type GraphProps = {
	distribution: Distribution;
	padding: number;
	note: number;
};

export default function Graph({ distribution, padding, note }: GraphProps) {
	return (
		<View style={styles.container}>
			{distribution.map((value, index) => (
				<View style={styles.barContainer} key={index}>
					<View
						style={[
							styles.bar,
							{
								width:
									(Dimensions.get("window").width - padding * 2) /
										distribution.length -
									GAP,
								height: `${10 + (value / Math.max(...distribution)) * 90}%`,
								backgroundColor:
									Math.floor(note) === index
										? getTheme().cyanTransparent
										: getTheme().cyanSemiTransparent,
							},
						]}
					>
						<View
							style={[
								styles.barHead,
								{
									backgroundColor:
										Math.floor(note) === index
											? getTheme().cyan
											: getTheme().cyanSemiTransparent,
								},
							]}
						/>
					</View>
					<Text
						style={[
							styles.barText,
							{
								color:
									Math.floor(note) === index
										? getTheme().darkGray
										: getTheme().lightGray,
							},
						]}
					>
						{index}
					</Text>
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: "row",
		marginTop: 40,
		height: 100,
		gap: GAP,
	},
	barContainer: {
		height: "100%",
		gap: 2,
	},
	bar: {
		marginTop: "auto",
		borderRadius: 5,
	},
	barHead: {
		borderRadius: 5,
		height: 10,
	},
	barText: {
		fontSize: 10,
		fontFamily: "Rubik-Regular",
		textAlign: "center",
	},
});
