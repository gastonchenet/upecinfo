import type { Moment } from "moment";

export enum Campus {
	Senart = "sen",
	Fontainebleau = "fbl",
}

type Promo = {
	name: string;
	year: number;
	campus: Campus;
	group: number;
	planningIds: string[];
};

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

export type { Promo, Planning, PlanningEvent, MealEvent };
