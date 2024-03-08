import {
	DAY_WIDTH,
	TIME_HEIGHT,
	DAYS,
	HOURS,
	TIME_LABEL_SPACE,
	DAY_LABEL_SPACE,
	START_HOUR,
} from "../constants";

import { createCanvas } from "@napi-rs/canvas";
import wrapText from "./wrapText";
import { PlanningEvent } from "../types";
import colorByTitle from "./colorByTitle";
import moment from "moment";

const Days = Object.freeze([
	"Lundi",
	"Mardi",
	"Mercredi",
	"Jeudi",
	"Vendredi",
	"Samedi",
]);

export default function makeCanvas(planning: PlanningEvent[]) {
	const canvas = createCanvas(
		DAY_WIDTH * DAYS + TIME_LABEL_SPACE,
		TIME_HEIGHT * HOURS + DAY_LABEL_SPACE
	);

	const ctx = canvas.getContext("2d");

	ctx.fillStyle = "#1b1d21";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = "#2a2c30";
	ctx.fillRect(
		TIME_LABEL_SPACE,
		DAY_LABEL_SPACE,
		canvas.width - TIME_LABEL_SPACE,
		canvas.height - DAY_LABEL_SPACE
	);

	ctx.strokeStyle = "#aaaaaa";
	for (let i = 1; i < DAYS - 1; i++) {
		ctx.strokeRect(
			TIME_LABEL_SPACE + i * DAY_WIDTH,
			-10,
			DAY_WIDTH,
			DAY_LABEL_SPACE + 10
		);
	}

	ctx.fillStyle = "#eeeeee";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.font = "30px Arial";

	for (let i = 0; i < DAYS; i++) {
		ctx.fillText(
			Days[i],
			TIME_LABEL_SPACE + i * DAY_WIDTH + DAY_WIDTH / 2,
			DAY_LABEL_SPACE / 2
		);
	}

	for (let i = 0; i < HOURS; i++) {
		ctx.fillText(
			`${START_HOUR + i}:00 -`,
			TIME_LABEL_SPACE / 2,
			DAY_LABEL_SPACE + i * TIME_HEIGHT
		);
	}

	ctx.strokeStyle = "#666666";
	for (let i = 0; i < DAYS; i++) {
		for (let j = 0; j < HOURS; j++) {
			ctx.strokeRect(
				TIME_LABEL_SPACE + i * DAY_WIDTH,
				DAY_LABEL_SPACE + j * TIME_HEIGHT,
				DAY_WIDTH,
				TIME_HEIGHT
			);
		}
	}

	ctx.strokeStyle = "#aaaaaa";
	ctx.strokeRect(
		TIME_LABEL_SPACE,
		DAY_LABEL_SPACE,
		canvas.width,
		canvas.height
	);

	planning.forEach((classData) => {
		const [clear, dark] = colorByTitle(
			classData.summary.split(/\./).slice(0, -1).join(".")
		);

		const start = moment(classData.start);
		const end = moment(classData.end);

		const width = DAY_WIDTH - 2;
		const left =
			TIME_LABEL_SPACE +
			(start.diff(start.clone().startOf("week"), "days") - 1) * DAY_WIDTH +
			1;

		const top =
			DAY_LABEL_SPACE +
			(start.diff(start.clone().startOf("day"), "minutes") / 60 -
				START_HOUR +
				1) *
				TIME_HEIGHT +
			1;

		const height = end.diff(start, "minutes") * (TIME_HEIGHT / 60) - 2;

		ctx.fillStyle = clear;
		ctx.strokeStyle = dark;

		ctx.beginPath();
		ctx.roundRect(left, top, width, height, 20);
		ctx.fill();
		ctx.stroke();

		ctx.fillStyle = "#1b1d21";
		ctx.textAlign = "left";
		ctx.textBaseline = "alphabetic";
		ctx.font = "30px Arial";
		wrapText(
			ctx,
			classData.summary + " - " + classData.location,
			left + 20,
			top + 50,
			width - 40,
			35
		);

		ctx.font = "15px Arial";
		wrapText(
			ctx,
			classData.teacher,
			left + 20,
			top + height - 40,
			width - 40,
			20
		);
	});

	return canvas.encode("png");
}
