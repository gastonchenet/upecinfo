import type { Planning, PlanningEvent } from "../types/Planning";
import moment from "moment";

enum ModificationType {
	Added,
	Deleted,
	ModifiedTitle,
	ModifiedLocation,
	ModifiedTeacher,
	ModifiedDate,
}

type Change = {
	from: PlanningEvent | null;
	to: PlanningEvent | null;
	type: ModificationType;
};

export function compareEvents(
	planning1: PlanningEvent[],
	planning2: PlanningEvent[],
	added: boolean
): Change[] {
	return planning1
		.filter((event) => !planning2.some((e) => e.uid === event.uid))
		.map((event) => ({
			from: added ? null : event,
			to: added ? event : null,
			type: added ? ModificationType.Added : ModificationType.Deleted,
		}));
}

export function compareModifiedEvents(
	planning1: PlanningEvent[],
	planning2: PlanningEvent[]
) {
	const modifiedEvents: Change[] = [];

	planning1.forEach((event1) => {
		const event2 = planning2.find((e) => e.uid === event1.uid);

		if (event2) {
			if (moment(event1.start).format() !== moment(event2.start).format()) {
				return modifiedEvents.push({
					from: event1,
					to: event2,
					type: ModificationType.ModifiedDate,
				});
			}

			if (event1.summary !== event2.summary) {
				return modifiedEvents.push({
					from: event1,
					to: event2,
					type: ModificationType.ModifiedTitle,
				});
			}

			if (event1.location !== event2.location) {
				return modifiedEvents.push({
					from: event1,
					to: event2,
					type: ModificationType.ModifiedLocation,
				});
			}

			if (event1.teacher !== event2.teacher) {
				return modifiedEvents.push({
					from: event1,
					to: event2,
					type: ModificationType.ModifiedTeacher,
				});
			}
		}
	});

	return modifiedEvents;
}

export function formatChanges(changes: Change[]) {
	return changes.map((change) => {
		if (!change.from) {
			return `Ajout de '${change.to?.summary}' le ${moment(
				change.to!.start
			).format("ddd D MMMM [à] HH[h]mm")}`;
		}

		if (!change.to) {
			return `Suppression de '${change.from.summary}' le ${moment(
				change.from.start
			).format("ddd D MMMM [à] HH[h]mm")}`;
		}

		const date = moment(change.to.start).format("ddd D MMMM [à] HH[h]mm");

		switch (change.type) {
			case ModificationType.ModifiedDate:
				return `Modification de la date de '${change.from.summary}' le ${date}`;
			case ModificationType.ModifiedTitle:
				return `Modification du titre de '${change.from.summary}' le ${date}`;
			case ModificationType.ModifiedLocation:
				return `Modification du lieu de '${change.from.summary}' le ${date}`;
			case ModificationType.ModifiedTeacher:
				return `Modification du professeur de '${change.from.summary}' le ${date}`;
			default:
				return `Changement inconnu de '${change.from.summary}' le ${date}`;
		}
	});
}

export default function comparePlannings(
	planning1: Planning,
	planning2: Planning,
	forward: number
) {
	const fPlanning1 = Object.values(planning1).flat();
	const fPlanning2 = Object.values(planning2).flat();

	const ffPlanning1 = fPlanning1.filter((event) =>
		moment(event.start).isBetween(
			moment().startOf("day"),
			moment().startOf("day").add(forward, "days")
		)
	);

	const ffPlanning2 = fPlanning2.filter((event) =>
		moment(event.start).isBetween(
			moment().startOf("day"),
			moment().startOf("day").add(forward, "days")
		)
	);

	const added = compareEvents(ffPlanning1, ffPlanning2, true);
	const deleted = compareEvents(ffPlanning2, ffPlanning1, false);
	const modified = compareModifiedEvents(ffPlanning1, ffPlanning2);

	return [...added, ...deleted, ...modified];
}
