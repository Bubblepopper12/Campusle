import type { College, FootballTeam, TeamColor } from "./types";
import { bearingDegrees, compass, distanceMiles, type Compass } from "./geo";
import { compact, formatInt, miles, money, percent, tileConference } from "./format";

export type TileColor = "green" | "yellow" | "orange" | "red" | "gray" | "missing";
export type Direction = "up" | "down" | null;

export interface TileResult {
  color: TileColor;
  /** Which way the answer is from the guess (number tiles only). */
  dir: Direction;
  text: string;
  unit?: string;
  /** Location tiles: bearing snapped to 45°, and its compass name. */
  bearing?: number;
  compass?: Compass;
  /** Colors tiles: the guessed team's colors. */
  swatches?: string[];
  /** The guess is the answer. */
  hit?: boolean;
  aria: string;
}

/** Location heat bands, in miles. Same state is always green. */
export const NEAR_MILES = 250;
export const MID_MILES = 750;

export function compareLocation(guess: College, answer: College): TileResult {
  if (guess.id === answer.id) return { color: "green", dir: null, text: "🎯", hit: true, aria: "Location: correct school" };
  const d = distanceMiles(guess, answer);
  const b = bearingDegrees(guess, answer);
  const dir8 = compass(b);
  const color: TileColor = guess.state === answer.state ? "green" : d < NEAR_MILES ? "yellow" : d < MID_MILES ? "orange" : "red";
  return {
    color,
    dir: null,
    text: miles(d),
    unit: "mi",
    bearing: (Math.round(b / 45) % 8) * 45,
    compass: dir8,
    aria: `Location: ${formatInt(d)} miles away, answer is to the ${dir8}${guess.state === answer.state ? ", same state" : ""}`,
  };
}

/**
 * How "close" is measured for each number:
 * - relative: difference as a share of the answer (enrollment, tuition, acceptance, stadium size)
 * - age: difference as a share of the answer's age in years (founding year, first season),
 *        so 1890 vs 1895 counts as close but 1890 vs 1980 doesn't
 * - count: small whole numbers (titles): exact is green, within 2 is yellow
 */
export type Scale = "relative" | "age" | "count";

export const GREEN_WITHIN = 0.05;
export const YELLOW_WITHIN = 0.25;

export function compareNumber(
  guess: number | null,
  answer: number | null,
  scale: Scale,
  format: (n: number) => string,
  label: string,
  year: number = new Date().getFullYear(),
): TileResult {
  if (guess === null || answer === null) return { color: "missing", dir: null, text: "?", aria: `${label}: unknown` };
  const text = format(guess);
  if (guess === answer) return { color: "green", dir: null, text, aria: `${label}: ${text}, exact match` };
  const dir: Direction = answer > guess ? "up" : "down";
  const diff = Math.abs(answer - guess);
  let color: TileColor;
  if (scale === "count") {
    color = diff <= 2 ? "yellow" : "gray";
  } else {
    const base = scale === "age" ? Math.max(year - answer, 1) : Math.abs(answer);
    const rel = base === 0 ? Infinity : diff / base;
    color = rel <= GREEN_WITHIN ? "green" : rel <= YELLOW_WITHIN ? "yellow" : "gray";
  }
  const shownDir = color === "green" ? null : dir;
  const hint = color === "green" ? "very close" : `answer is ${dir === "up" ? "higher" : "lower"}${color === "yellow" ? ", close" : ""}`;
  return { color, dir: shownDir, text, aria: `${label}: ${text}, ${hint}` };
}

export function compareCategory(guess: string | null, answer: string | null, label: string): TileResult {
  if (!guess || !answer) return { color: "missing", dir: null, text: guess ? tileConference(guess) : "?", aria: `${label}: unknown` };
  const match = guess === answer;
  return { color: match ? "green" : "gray", dir: null, text: tileConference(guess), aria: `${label}: ${guess}, ${match ? "match" : "no match"}` };
}

const FAMILIES: [RegExp, string][] = [
  [/maroon/, "maroon"],
  [/orange/, "orange"],
  [/crimson|cardinal|scarlet|garnet|cherry|red/, "red"],
  [/gold|maize|yellow/, "gold"],
  [/navy|blue/, "blue"],
  [/green|teal/, "green"],
  [/purple/, "purple"],
  [/black/, "black"],
  [/white|cream/, "white"],
  [/gr[ae]y|silver/, "gray"],
  [/brown|bronze/, "brown"],
];

export function colorFamily(name: string): string {
  const n = name.toLowerCase();
  return FAMILIES.find(([re]) => re.test(n))?.[1] ?? n;
}

/** Green: same main color family. Yellow: they share any other color (white doesn't count). */
export function compareColors(guess: TeamColor[], answer: TeamColor[], sameTeam: boolean): TileResult {
  const swatches = guess.map((c) => c.hex);
  const names = guess.map((c) => c.name).join(" & ");
  if (!guess.length || !answer.length) return { color: "missing", dir: null, text: "?", swatches, aria: "Colors: unknown" };
  const g = guess.map((c) => colorFamily(c.name));
  const a = answer.map((c) => colorFamily(c.name));
  let color: TileColor = "gray";
  if (sameTeam || g[0] === a[0]) color = "green";
  else if (g.some((f) => f !== "white" && a.includes(f))) color = "yellow";
  const desc = color === "green" ? "same main color" : color === "yellow" ? "shares a color" : "no shared colors";
  return { color, dir: null, text: "", swatches, aria: `Colors: ${names}, ${desc}` };
}

export function evaluateClassic(guess: College, answer: College, year?: number): TileResult[] {
  return [
    compareLocation(guess, answer),
    compareNumber(guess.undergrads, answer.undergrads, "relative", compact, "Undergrads", year),
    compareNumber(guess.acceptance, answer.acceptance, "relative", percent, "Acceptance rate", year),
    compareNumber(guess.tuition, answer.tuition, "relative", money, "In-state tuition", year),
    compareNumber(guess.founded, answer.founded, "age", String, "Founded", year),
    compareCategory(guess.conference, answer.conference, "Conference"),
  ];
}

export function evaluateFootball(
  guess: College,
  answer: College,
  guessTeam: FootballTeam,
  answerTeam: FootballTeam,
  year?: number,
): TileResult[] {
  return [
    compareLocation(guess, answer),
    compareCategory(guessTeam.conference, answerTeam.conference, "Football conference"),
    compareNumber(guessTeam.capacity, answerTeam.capacity, "relative", compact, "Stadium capacity", year),
    compareNumber(guessTeam.firstSeason, answerTeam.firstSeason, "age", String, "First season", year),
    compareNumber(guessTeam.titles, answerTeam.titles, "count", String, "National titles", year),
    compareColors(guessTeam.colors, answerTeam.colors, guess.id === answer.id),
  ];
}
