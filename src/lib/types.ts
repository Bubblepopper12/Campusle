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

export type Position = "QB" | "RB" | "WR" | "TE" | "OL" | "DL" | "LB" | "DB" | "K" | "P" | "ATH";

/** One famous college football player in src/data/players.json. */
export interface Player {
  id: string;
  name: string;
  /** Display name (same as name; kept so players and schools share one shape for search). */
  short: string;
  aliases: string[];
  position: Position;
  /** College ids, most famous school first. */
  schools: string[];
  /** Final college season played (the current season for active players). */
  lastSeason: number;
  /** Heisman years won, empty if none. */
  heisman: number[];
  /** National titles their school won while they were on the roster. */
  titles: number;
  jersey: number;
  active: boolean;
}

export interface PlayersFile {
  source: string;
  generatedAt: string;
  players: Player[];
}
