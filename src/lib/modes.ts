import type { College } from "./types";
import { CLASSIC_ANSWERS, COLLEGES, COLLEGE_BY_ID, TEAMS, TEAM_BY_ID } from "./data";
import { evaluateClassic, evaluateFootball, type TileResult } from "./feedback";
import { formatInt, percent } from "./format";

export type Mode = "classic" | "gridiron";
export const MODES: Mode[] = ["classic", "gridiron"];

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

export interface ModeConfig {
  id: Mode;
  name: string;
  emoji: string;
  /** Title used in the share text. */
  shareTitle: string;
  tagline: string;
  columns: Column[];
  /** Schools that can be guessed. */
  pool: College[];
  /** Ids the daily answer is drawn from. */
  answers: string[];
  evaluate(guess: College, answer: College): TileResult[];
  facts(answer: College): Fact[];
  /** Confetti colors for a win. */
  confetti(answer: College): string[];
}

const ACCENT_CONFETTI = ["#FF4F1A", "#FFC23D", "#2E6BFF", "#1FB36B", "#FFFFFF"];

const classic: ModeConfig = {
  id: "classic",
  name: "Classic",
  emoji: "🎓",
  shareTitle: "Campusle",
  tagline: "Any well-known college",
  columns: [
    { kind: "location", label: "Where", icon: "📍", help: "Miles and direction from your guess to the answer. Green = same state." },
    { kind: "number", label: "Size", icon: "👥", help: "Undergraduate enrollment." },
    { kind: "number", label: "Admit", icon: "🎟️", help: "Acceptance rate." },
    { kind: "number", label: "Tuition", icon: "💵", help: "In-state tuition and fees per year." },
    { kind: "number", label: "Founded", icon: "🏛️", help: "Year founded." },
    { kind: "category", label: "Conf", icon: "🏆", help: "Athletic conference (D-II, D-III, or None for schools outside Division I)." },
  ],
  pool: COLLEGES,
  answers: CLASSIC_ANSWERS,
  evaluate: (g, a) => evaluateClassic(g, a),
  facts: (a) =>
    [
      { label: "Undergrads", value: a.undergrads === null ? "?" : formatInt(a.undergrads) },
      { label: "Acceptance", value: a.acceptance === null ? "?" : percent(a.acceptance) },
      { label: "In-state tuition", value: a.tuition === null ? "?" : `$${formatInt(a.tuition)}` },
      { label: "Founded", value: a.founded === null ? "?" : String(a.founded) },
      { label: "Conference", value: a.conference ?? "?" },
      { label: "Type", value: a.control === "public" ? "Public" : a.control === "private" ? "Private" : "?" },
    ],
  confetti: () => ACCENT_CONFETTI,
};

const gridiron: ModeConfig = {
  id: "gridiron",
  name: "Gridiron",
  emoji: "🏈",
  shareTitle: "Campusle Gridiron",
  tagline: "FBS football teams",
  columns: [
    { kind: "location", label: "Where", icon: "📍", help: "Miles and direction from your guess to the answer. Green = same state." },
    { kind: "category", label: "Conf", icon: "🏆", help: "Football conference for the 2026 season." },
    { kind: "number", label: "Stadium", icon: "🏟️", help: "Home stadium capacity." },
    { kind: "number", label: "Since", icon: "📜", help: "First season of varsity football." },
    { kind: "number", label: "Titles", icon: "🥇", help: "National championships the school claims. Yellow = within 2." },
    { kind: "colors", label: "Colors", icon: "🎨", help: "Team colors. Green = same main color, yellow = shares a color (white doesn't count)." },
  ],
  pool: TEAMS.map((t) => COLLEGE_BY_ID.get(t.id)!),
  answers: TEAMS.map((t) => t.id),
  evaluate: (g, a) => evaluateFootball(g, a, TEAM_BY_ID.get(g.id)!, TEAM_BY_ID.get(a.id)!),
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
  confetti: (a) => {
    const colors = TEAM_BY_ID.get(a.id)?.colors.map((c) => c.hex) ?? [];
    return colors.length ? [...colors, ...colors, "#FFC23D"] : ACCENT_CONFETTI;
  },
};

export const MODE_CONFIG: Record<Mode, ModeConfig> = { classic, gridiron };

export const isMode = (v: unknown): v is Mode => v === "classic" || v === "gridiron";

