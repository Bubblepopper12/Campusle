export type Control = "public" | "private";

/** One school in src/data/colleges.json. Numbers are null when the source had no value. */
export interface College {
  id: string;
  name: string;
  short: string;
  aliases: string[];
  city: string;
  state: string;
  lat: number;
  lon: number;
  /** Undergraduate enrollment (degree-seeking). */
  undergrads: number | null;
  /** In-state tuition and fees, USD per year. */
  tuition: number | null;
  /** Overall admission rate, 0..1. */
  acceptance: number | null;
  control: Control | null;
  founded: number | null;
  /** Primary athletic conference, or "Division II" / "Division III" / "NAIA" / "None". */
  conference: string | null;
  mascot: string | null;
}

export interface TeamColor {
  name: string;
  hex: string;
}

/** One FBS program in src/data/football.json, keyed to a College by id. */
export interface FootballTeam {
  id: string;
  conference: string;
  stadium: string;
  capacity: number | null;
  firstSeason: number | null;
  titles: number | null;
  colors: TeamColor[];
}

export interface CollegesFile {
  source: string;
  generatedAt: string;
  colleges: College[];
}

export interface FootballFile {
  source: string;
  generatedAt: string;
  teams: FootballTeam[];
}
