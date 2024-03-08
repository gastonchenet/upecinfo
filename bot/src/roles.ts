import { Campus } from "./types";

export class Promo {
	public name: string;
	public campus: Campus;
	public group: number;
	public year: number;

	constructor(name: string, year: number, campus: Campus, group: number) {
		this.name = name;
		this.year = year;
		this.campus = campus;
		this.group = group;
	}

	public get url() {
		return "";
	}
}

const {
	BUT1_OFF_SEN_ID,
	BUT1_OFF_FBL_GR1_ID,
	BUT1_OFF_FBL_GR2_ID,
	BUT1_OFF_FBL_GR3_ID,
	BUT1_OFF_FBL_GR4_ID,
	BUT1_OFF_FBL_GR5_ID,
	BUT1_OFF_FBL_GR6_ID,
	BUT2FA_OFF_FBL_ID,
	BUT2FI_OFF_FBL_GR1_ID,
	BUT2FI_OFF_FBL_GR2_ID,
	BUT2FI_OFF_FBL_GR3_ID,
	BUT3_OFF_FBL_ID,

	BUT1_POV_SEN_ID,
	BUT1_POV_FBL_GR1_ID,
	BUT1_POV_FBL_GR2_ID,
	BUT1_POV_FBL_GR3_ID,
	BUT1_POV_FBL_GR4_ID,
	BUT1_POV_FBL_GR5_ID,
	BUT1_POV_FBL_GR6_ID,
	BUT2FA_POV_FBL_ID,
	BUT2FI_POV_FBL_GR1_ID,
	BUT2FI_POV_FBL_GR2_ID,
	BUT2FI_POV_FBL_GR3_ID,
	BUT3_POV_FBL_ID,
} = process.env;

export const Off = {
	[BUT1_OFF_SEN_ID!]: new Promo("BUT 1 - Campus Sénart", 1, Campus.Sen, 1),
	[BUT1_OFF_FBL_GR1_ID!]: new Promo(
		"BUT 1 - Campus Fontainebleau, Groupe 1",
		1,
		Campus.Fbl,
		1
	),
	[BUT1_OFF_FBL_GR2_ID!]: new Promo(
		"BUT 1 - Campus Fontainebleau, Groupe 2",
		1,
		Campus.Fbl,
		2
	),
	[BUT1_OFF_FBL_GR3_ID!]: new Promo(
		"BUT 1 - Campus Fontainebleau, Groupe 3",
		1,
		Campus.Fbl,
		3
	),
	[BUT1_OFF_FBL_GR4_ID!]: new Promo(
		"BUT 1 - Campus Fontainebleau, Groupe 4",
		1,
		Campus.Fbl,
		4
	),
	[BUT1_OFF_FBL_GR5_ID!]: new Promo(
		"BUT 1 - Campus Fontainebleau, Groupe 5",
		1,
		Campus.Fbl,
		5
	),
	[BUT1_OFF_FBL_GR6_ID!]: new Promo(
		"BUT 1 - Campus Fontainebleau, Groupe 6",
		1,
		Campus.Fbl,
		6
	),
	[BUT2FA_OFF_FBL_ID!]: new Promo("BUT 2, Groupe FA", 2, Campus.Fbl, 5),
	[BUT2FI_OFF_FBL_GR1_ID!]: new Promo("BUT 2, Groupe 1", 2, Campus.Fbl, 1),
	[BUT2FI_OFF_FBL_GR2_ID!]: new Promo("BUT 2, Groupe 2", 2, Campus.Fbl, 2),
	[BUT2FI_OFF_FBL_GR3_ID!]: new Promo("BUT 2, Groupe 3", 2, Campus.Fbl, 3),
	[BUT3_OFF_FBL_ID!]: new Promo("BUT 3", 3, Campus.Fbl, 1),
};

export const Pov = {
	[BUT1_POV_SEN_ID!]: new Promo("BUT 1 - Campus Sénart", 1, Campus.Sen, 1),
	[BUT1_POV_FBL_GR1_ID!]: new Promo(
		"BUT 1 - Campus Fontainebleau, Groupe 1",
		1,
		Campus.Fbl,
		1
	),
	[BUT1_POV_FBL_GR2_ID!]: new Promo(
		"BUT 1 - Campus Fontainebleau, Groupe 2",
		1,
		Campus.Fbl,
		2
	),
	[BUT1_POV_FBL_GR3_ID!]: new Promo(
		"BUT 1 - Campus Fontainebleau, Groupe 3",
		1,
		Campus.Fbl,
		3
	),
	[BUT1_POV_FBL_GR4_ID!]: new Promo(
		"BUT 1 - Campus Fontainebleau, Groupe 4",
		1,
		Campus.Fbl,
		4
	),
	[BUT1_POV_FBL_GR5_ID!]: new Promo(
		"BUT 1 - Campus Fontainebleau, Groupe 5",
		1,
		Campus.Fbl,
		5
	),
	[BUT1_POV_FBL_GR6_ID!]: new Promo(
		"BUT 1 - Campus Fontainebleau, Groupe 6",
		1,
		Campus.Fbl,
		6
	),
	[BUT2FA_POV_FBL_ID!]: new Promo("BUT 2, Groupe FA", 2, Campus.Fbl, 5),
	[BUT2FI_POV_FBL_GR1_ID!]: new Promo("BUT 2, Groupe 1", 2, Campus.Fbl, 1),
	[BUT2FI_POV_FBL_GR2_ID!]: new Promo("BUT 2, Groupe 2", 2, Campus.Fbl, 2),
	[BUT2FI_POV_FBL_GR3_ID!]: new Promo("BUT 2, Groupe 3", 2, Campus.Fbl, 3),
	[BUT3_POV_FBL_ID!]: new Promo("BUT 3", 3, Campus.Fbl, 1),
};

export default { ...Off, ...Pov };
