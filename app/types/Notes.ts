type Evaluation = {
	title: string;
	coefficient: number;
	note: number;
	min_note: number;
	max_note: number;
	average: number;
	date: string | null;
	weight: string[];
};

type Resource = {
	id: string;
	title: string;
	evaluations: Evaluation[];
};

type Semester = {
	num: number;
	startDate: string;
	endDate: string;
	rank: string;
	groupSize: number;
	note: number;
	min_note: number;
	max_note: number;
	average: number;
	resources: Resource[];
	saes: Resource[];
};

export type { Semester, Resource, Evaluation };
