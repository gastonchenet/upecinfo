import React, { useEffect, useState } from "react";
import { Dimensions, Text, View } from "react-native";
import Colors from "../../constants/Colors";
import darkMode from "./styles/darkMode";
import lightMode from "./styles/lightMode";
import type { Distribution } from "../../types/Notes";

const GAP = 5;

type GraphProps = {
	distribution: Distribution;
	padding: number;
	note: number;
	theme: "light" | "dark";
};

export default function Graph({
	distribution,
	padding,
	note,
	theme,
}: GraphProps) {
	const [styles, setStyles] = useState(theme === "dark" ? darkMode : lightMode);

	useEffect(() => {
		if (theme === "dark") {
			setStyles(darkMode);
		} else {
			setStyles(lightMode);
		}
	}, [theme]);

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
										? Colors.cyanTransparent
										: Colors.cyanSemiTransparent,
							},
						]}
					>
						<View
							style={[
								styles.barHead,
								{
									backgroundColor:
										Math.floor(note) === index
											? Colors.cyan
											: Colors.cyanSemiTransparent,
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
										? Colors[theme].darkGray
										: Colors[theme].lightGray,
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
