import type { Moment } from "moment";

type PlanningEvent = {
	start: string;
	end: string;
	summary: string;
	location: string;
	teacher: string;
};

type MealEvent = {
	start: Moment;
	end: Moment;
	duration: number;
};

type Planning = { [key: string]: PlanningEvent[] };

export type { Planning, PlanningEvent, MealEvent };
