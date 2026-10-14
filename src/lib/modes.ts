import type { College, Player } from "./types";
import { CLASSIC_ANSWERS, COLLEGES, COLLEGE_BY_ID, HARD_ANSWERS, PLAYERS, PLAYER_BY_ID, TEAMS, TEAM_BY_ID, conferenceOf } from "./data";
import { evaluateClassic, evaluateFootball, evaluatePlayer, type TileResult } from "./feedback";
import { formatInt, percent } from "./format";

/**
 * Game modes. Ids are stored in saved games and stats, so they never change even when a mode is renamed
 * ("gridiron" is shown as Football).
 */
export type Mode = "classic" | "hard" | "gridiron" | "players";
export const MODES: Mode[] = ["classic", "hard", "gridiron", "players"];

/** The themed scenes: lecture hall (chalkboard), stadium (jumbotron + field) and trading cards (foil pack + graded slabs). */
export type Scene = "classic" | "gridiron" | "cards";

/**
 * The ☰ menu, in order. Classic is the home game; the rest live in the menu.
 * `tier` is where a paywall would hook in later: every game is "free" for now.
 */
export interface MenuEntry {
  /** The mode the entry opens. */
  mode: Mode;
  title: string;
  blurb: string;
  /** Difficulty levels shown inside the entry (Classic: Normal / Hard). */
  levels?: { mode: Mode; label: string }[];
  tier: "free" | "premium";
}

export const MENU: MenuEntry[] = [
  {
    mode: "classic",
    title: "Classic",
    blurb: "Guess the mystery college",
    levels: [
      { mode: "classic", label: "Normal" },
      { mode: "hard", label: "Hard 🧠" },
    ],
    tier: "free",
  },
  { mode: "gridiron", title: "Football", blurb: "FBS football programs", tier: "free" },
  { mode: "players", title: "Players", blurb: "College football stars", tier: "free" },
];
/** URL hash per mode (classic has none). */
export const HASH: Record<Mode, string> = { classic: "", hard: "hard", gridiron: "football", players: "players" };

export function modeFromHash(hash: string): Mode | null {
  const h = hash.replace("#", "").toLowerCase();
  if (h === "classic" || h === "hard" || h === "players") return h;
  if (h === "football" || h === "gridiron" || h === "cfb") return "gridiron";
  return null;
}

export type ColumnKind = "location" | "number" | "category" | "colors";

export interface Column {
  kind: ColumnKind;
  label: string;
  icon: string;
  help: string;
}

export interface Fact {
  label: string;
  value: string;
  /** Spans both columns on the reveal card. */
  wide?: boolean;
}

/** What can be guessed: a school or a player. Both carry a display name and search aliases. */
export interface Entity {
  id: string;
  short: string;
  name: string;
  aliases: string[];
}

export interface ModeConfig {
  id: Mode;
  name: string;
  emoji: string;
  scene: Scene;
  /** Title used in the share text. */
  shareTitle: string;
  tagline: string;
  /** Painted in the stadium end zone. */
  endzone: string;
  /** "school", "program" or "player", for "Today's …" on the reveal card. */
  noun: string;
  columns: Column[];
  /** What can be guessed. */
  pool: Entity[];
  byId: Map<string, Entity>;
  /** Ids the daily answer is drawn from. */
  answers: string[];
  evaluate(guess: Entity, answer: Entity): TileResult[];
  facts(answer: Entity): Fact[];
  /** Small badges under the name on the reveal card. */
  chips(answer: Entity): string[];
  /** Colors for the stripe on the reveal card and the win confetti. */
  colors(answer: Entity): string[] | null;
  /** Under each guess on the board. */
  rowMeta(e: Entity): string;
  /** Autocomplete: second line and right-hand detail. */
  optionSub(e: Entity): string | null;
  optionMeta(e: Entity): string;
  /** Autocomplete tie-breaker: better-known entries first. */
  searchBoost(e: Entity): number;
}

const schoolShort = (id: string) => COLLEGE_BY_ID.get(id)?.short ?? id;
const teamColors = (collegeId: string) => {
  const colors = TEAM_BY_ID.get(collegeId)?.colors.map((c) => c.hex);
  return colors?.length ? colors : null;
};
const sizeBoost = (c: College) => Math.min(4, Math.log10(Math.max(c.undergrads ?? 1000, 1)) - 2);

const classicColumns: Column[] = [
  { kind: "location", label: "Where", icon: "📍", help: "Miles and direction from your guess to the answer. Green = same state." },
  { kind: "number", label: "Size", icon: "👥", help: "Undergraduate enrollment." },
  { kind: "number", label: "Admit", icon: "🎟️", help: "Acceptance rate." },
  { kind: "number", label: "Tuition", icon: "💵", help: "In-state tuition and fees per year." },
  { kind: "number", label: "Founded", icon: "🏛️", help: "Year founded." },
  { kind: "category", label: "Conf", icon: "🏆", help: "Athletic conference (D-II, D-III, or None for schools outside Division I)." },
];

function collegeMode(id: "classic" | "hard", answers: string[]): ModeConfig {
  const featured = new Set(CLASSIC_ANSWERS);
  return {
    id,
    name: id === "classic" ? "Classic" : "Hard",
    emoji: id === "classic" ? "🎓" : "🧠",
    scene: "classic",
    shareTitle: id === "classic" ? "Campusle" : "Campusle Hard",
    tagline: id === "classic" ? "Any well-known college" : "Niche colleges. Good luck",
    endzone: "",
    noun: "school",
    columns: classicColumns,
    pool: COLLEGES,
    byId: COLLEGE_BY_ID as Map<string, Entity>,
    answers,
    evaluate: (g, a) => evaluateClassic(g as College, a as College),
    facts: (e) => {
      const a = e as College;
      return [
        { label: "Undergrads", value: a.undergrads === null ? "?" : formatInt(a.undergrads) },
        { label: "Acceptance", value: a.acceptance === null ? "?" : percent(a.acceptance) },
        { label: "In-state tuition", value: a.tuition === null ? "?" : `$${formatInt(a.tuition)}` },
        { label: "Founded", value: a.founded === null ? "?" : String(a.founded) },
        { label: "Conference", value: a.conference ?? "?" },
        { label: "Type", value: a.control === "public" ? "Public" : a.control === "private" ? "Private" : "?" },
      ];
    },
    chips: (e) => {
      const a = e as College;
      return [`📍 ${a.city}, ${a.state}`, ...(a.mascot ? [`🐾 ${a.mascot}`] : [])];
    },
    colors: () => null,
    rowMeta: (e) => `${(e as College).city}, ${(e as College).state}`,
    optionSub: (e) => (e.short !== e.name ? e.name : null),
    optionMeta: (e) => `${(e as College).city}, ${(e as College).state}`,
    // Famous and bigger schools first. In Hard this pushes non-answers up, so it gives nothing away.
    searchBoost: (e) => (featured.has(e.id) ? 6 : 0) + sizeBoost(e as College),
  };
}

const gridiron: ModeConfig = {
  id: "gridiron",
  name: "Football",
  emoji: "🏈",
  scene: "gridiron",
  shareTitle: "Campusle Football",
  tagline: "FBS football teams",
  endzone: "FOOTBALL",
  noun: "program",
  columns: [
    { kind: "location", label: "Where", icon: "📍", help: "Miles and direction from your guess to the answer. Green = same state." },
    { kind: "category", label: "Conf", icon: "🏆", help: "Football conference for the 2026 season." },
    { kind: "number", label: "Stadium", icon: "🏟️", help: "Home stadium capacity." },
    { kind: "number", label: "Since", icon: "📜", help: "First season of varsity football." },
    { kind: "number", label: "Titles", icon: "🥇", help: "National championships the school claims. Yellow = within 2." },
    { kind: "colors", label: "Colors", icon: "🎨", help: "Team colors. Green = same main color, yellow = shares a color (white doesn't count)." },
  ],
  pool: TEAMS.map((t) => COLLEGE_BY_ID.get(t.id)!),
  byId: new Map(TEAMS.map((t) => [t.id, COLLEGE_BY_ID.get(t.id)!])),
  answers: TEAMS.map((t) => t.id),
  evaluate: (g, a) => evaluateFootball(g as College, a as College, TEAM_BY_ID.get(g.id)!, TEAM_BY_ID.get(a.id)!),
  facts: (a) => {
    const t = TEAM_BY_ID.get(a.id)!;
    return [
      { label: "Stadium", value: t.stadium, wide: true },
      { label: "Capacity", value: t.capacity === null ? "?" : formatInt(t.capacity) },
      { label: "Conference", value: t.conference },
      { label: "First season", value: t.firstSeason === null ? "?" : String(t.firstSeason) },
      { label: "National titles", value: t.titles === null ? "?" : String(t.titles) },
      { label: "Colors", value: t.colors.map((c) => c.name).join(" & ") },
    ];
  },
  chips: (e) => {
    const a = e as College;
    return [`📍 ${a.city}, ${a.state}`, ...(a.mascot ? [`🐾 ${a.mascot}`] : [])];
  },
  colors: (a) => teamColors(a.id),
  rowMeta: (e) => `${(e as College).city}, ${(e as College).state}`,
  optionSub: (e) => (e.short !== e.name ? e.name : null),
  optionMeta: (e) => `${(e as College).city}, ${(e as College).state}`,
  searchBoost: (e) => sizeBoost(e as College),
};

const players: ModeConfig = {
  id: "players",
  name: "Players",
  emoji: "⭐",
  scene: "cards",
  shareTitle: "Campusle Players",
  tagline: "College football stars",
  endzone: "PLAYERS",
  noun: "player",
  columns: [
    { kind: "category", label: "School", icon: "🏫", help: "Their main college. Yellow = they also played there, or the schools share a conference today." },
    { kind: "category", label: "Pos", icon: "🏈", help: "Position. Yellow = same side of the ball." },
    { kind: "number", label: "Final", icon: "📅", help: "Final college season (this season for active players). Yellow = within 3." },
    { kind: "category", label: "Heisman", icon: "🏆", help: "Did they win the Heisman? Green = same answer." },
    { kind: "number", label: "Titles", icon: "💍", help: "National titles their team won while they were there. Yellow = within 1." },
    { kind: "number", label: "Jersey", icon: "#️⃣", help: "Best-known college jersey number. Yellow = within 5." },
  ],
  pool: PLAYERS,
  byId: PLAYER_BY_ID as Map<string, Entity>,
  answers: PLAYERS.map((p) => p.id),
  evaluate: (g, a) => evaluatePlayer(g as Player, a as Player, schoolShort, conferenceOf),
  facts: (e) => {
    const p = e as Player;
    return [
      { label: p.schools.length > 1 ? "Schools" : "School", value: p.schools.map(schoolShort).join(", "), wide: true },
      { label: "Position", value: p.position },
      { label: p.active ? "Status" : "Final season", value: p.active ? "Playing now" : String(p.lastSeason) },
      { label: "Heisman", value: p.heisman.length ? `Yes (${p.heisman.join(", ")})` : "No" },
      { label: "National titles", value: String(p.titles) },
      { label: "Jersey", value: `#${p.jersey}` },
    ];
  },
  chips: (e) => {
    const p = e as Player;
    return [`🏫 ${schoolShort(p.schools[0])}`, `🏈 ${p.position} #${p.jersey}`];
  },
  colors: (e) => teamColors((e as Player).schools[0]),
  rowMeta: (e) => `${(e as Player).position} · ${schoolShort((e as Player).schools[0])}`,
  optionSub: (e) => {
    const p = e as Player;
    return `${p.position} · ${p.schools.map(schoolShort).join(", ")}`;
  },
  optionMeta: (e) => ((e as Player).active ? "Now" : String((e as Player).lastSeason)),
  searchBoost: (e) => ((e as Player).heisman.length ? 1 : 0),
};

export const MODE_CONFIG: Record<Mode, ModeConfig> = {
  classic: collegeMode("classic", CLASSIC_ANSWERS),
  hard: collegeMode("hard", HARD_ANSWERS),
  gridiron,
  players,
};

export const isMode = (v: unknown): v is Mode => typeof v === "string" && (MODES as string[]).includes(v);

const ACCENT_CONFETTI = ["#FF4F1A", "#FFC23D", "#2E6BFF", "#1FB36B", "#FFFFFF"];

export function confettiColors(cfg: ModeConfig, answer: Entity): string[] {
  const c = cfg.colors(answer);
  return c ? [...c, ...c, "#FFC23D"] : ACCENT_CONFETTI;
}
