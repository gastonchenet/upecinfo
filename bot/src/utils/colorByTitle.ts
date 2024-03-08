import { COLOR_NUMBER } from "../constants";

export default function colorByTitle(title: string) {
	const colorWidth = 360 / COLOR_NUMBER;
	let val = 0;

	for (let i = 0; i < title.length; i++) {
		val += title.charCodeAt(i);
	}

	return [
		`hsl(${(val % COLOR_NUMBER) * colorWidth}, 70%, 80%)`,
		`hsl(${(val % COLOR_NUMBER) * colorWidth}, 70%, 60%)`,
	];
}
