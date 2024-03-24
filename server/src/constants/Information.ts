import moment from "moment";

export const UPDATE_INTERVAL = 6e4;
export const GROUP_MESSAGE_MINUTES = 20;
export const INBOX_START_DATE = moment("08-28", "MM-DD").subtract(1, "year");
export const MIN_CONTENT_LENGTH = 64;

export const USERNAME_MAP: { [key: string]: string } = {
	"florent.madelaine": "Florent Madelaine",
	denismonnerat: "Denis Monnerat",
	rebr45: "Régis Brouard",
	patriciacrouanveron: "Patricia Crouan-Véron",
	largesandrine: "Sandra Largé",
	"selma.iutsf": "Selma Naboulsi",
	fbgervais78: "Frédéric Gervais",
	lucdartois: "Luc Dartois",
	annabelle_demulethenon_fbleaus: "Annabelle Demule Thenon",
	lgermerie: "Loïc Germerie Guizouarn",
	pvalarcher: "Pierre Valarcher",
};
