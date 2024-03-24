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

export enum EventType {
	Class,
	Evaluation,
	Sae,
}

type Promo = {
	name: string;
	year: number;
	campus: Campus;
	group: number;
	notificationChannel: string;
	planningIds: string[];
	info: { channel: string; role: string } | null;
};

type PlanningEvent = {
	uid: string;
	start: string;
	end: string;
	summary: string;
	location: string;
	teacher: string;
	type: EventType;
};

type MealEvent = {
	start: Moment;
	end: Moment;
	duration: number;
};

type Planning = { [key: string]: PlanningEvent[] };

export type { Promo, Planning, PlanningEvent, MealEvent };
