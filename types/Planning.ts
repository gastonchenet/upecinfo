import type { Moment } from "moment";

export type PlanningEvent = {
	start: string;
	end: string;
	summary: string;
	location: string;
	teacher: string;
};

export type MealEvent = {
	start: Moment;
	end: Moment;
	duration: number;
};
