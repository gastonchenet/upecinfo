type Note = {
	value: string;
	min: string;
	max: string;
	moy: string;
};

type RawEvaluation = {
	id: number;
	coef: string;
	date_debut: string | null;
	date_fin: string | null;
	description: string;
	evaluation_type: number;
	note: Note;
	poids: { [key: string]: number };
	url: string;
	date: string | null;
	heure_debut: string | null;
	heure_fin: string | null;
};

type RawResource = {
	id: number;
	titre: string;
	code_apogee: null;
	url: string;
	moyenne: Object;
	evaluations: RawEvaluation[];
};

type RawSemester = {
	num: number;
	startDate: string;
	endDate: string;
	rank: string;
	groupSize: number;
	note: string;
	min_note: string;
	max_note: string;
	average: string;
	resources: { [key: string]: RawResource };
	saes: { [key: string]: RawResource };
};

type Evaluation = {
	id: number;
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

export type {
	Semester,
	Resource,
	Evaluation,
	Note,
	RawEvaluation,
	RawResource,
	RawSemester,
};
