import { MealEvent, PlanningEvent } from "../types/Planning";
import moment from "moment";
import "moment/locale/fr";

const MIN_MEAL_TIME = 10;
const MAX_MEAL_TIME = 16;
const IDEAL_MEAL_TIME = 12;
const MIN_MEAL_DURATION = 30;

export default function getMealEvent(dayEvents: PlanningEvent[]) {
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
		.sort(
			(a, b) =>
				Math.abs((a.start.hour() + a.end.hour()) / 2 - IDEAL_MEAL_TIME) -
				Math.abs((b.start.hour() + b.end.hour()) / 2 - IDEAL_MEAL_TIME)
		)
		.sort((a, b) => b.duration - a.duration);

	return sortedHoles[0] ?? null;
}
