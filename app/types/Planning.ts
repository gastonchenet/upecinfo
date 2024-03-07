import type { Moment } from "moment";

export enum Campus {
	Senart = "sen",
	Fontainebleau = "fbl",
}

export enum Sector {
	Info = "info",
	Tc = "tc",
	Mmi = "mmi",
}

type Promo = {
	name: string;
	year: number;
	campus: Campus;
	group: number;
	notificationChannel: string;
	planningIds: string[];
};

type PlanningEvent = {
	uid: string;
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

type Promos = { [key: string]: (Promo & { fetching: boolean })[] };

export type { Promos, Promo, Planning, PlanningEvent, MealEvent };
