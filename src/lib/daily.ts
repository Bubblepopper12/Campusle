import { seededShuffle } from "./rng";

/** Puzzle #1 is played on this local date. */
export const LAUNCH_DATE = { year: 2026, month: 10, day: 11 };

const DAY_MS = 86_400_000;

/** Whole local calendar days since the epoch. Uses the local Y/M/D so DST shifts never skip or repeat a day. */
export function localDayNumber(date: Date): number {
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

const LAUNCH_DAY = Math.round(Date.UTC(LAUNCH_DATE.year, LAUNCH_DATE.month - 1, LAUNCH_DATE.day) / DAY_MS);

/** Today's puzzle number in the player's time zone. Never below 1. */
export function puzzleNumber(now: Date = new Date()): number {
  return Math.max(1, localDayNumber(now) - LAUNCH_DAY + 1);
}

/** Milliseconds until the next local midnight. */
export function msUntilNextPuzzle(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

const cycles = new Map<string, string[]>();

function cycleOrder(ids: readonly string[], salt: string, cycle: number): string[] {
  const key = `${salt}:${cycle}:${ids.length}`;
  let order = cycles.get(key);
  if (!order) {
    order = seededShuffle(ids, `campusle:${salt}:${cycle}`);
    if (cycle > 0 && ids.length > 1) {
      // Never show the same school on the last day of one cycle and the first day of the next.
      const prev = cycleOrder(ids, salt, cycle - 1);
      if (order[0] === prev[prev.length - 1]) [order[0], order[1]] = [order[1], order[0]];
    }
    cycles.set(key, order);
  }
  return order;
}

/**
 * The answer id for a puzzle. The list is sorted first so file order doesn't matter, then each pass
 * through it is a fresh seeded shuffle: no repeats until every school has been used.
 */
export function answerFor(puzzle: number, answerIds: readonly string[], salt: string): string {
  const sorted = [...answerIds].sort();
  const index = puzzle - 1;
  const cycle = Math.floor(index / sorted.length);
  return cycleOrder(sorted, salt, cycle)[index % sorted.length];
}

/** An answer list and the puzzle it starts on. Each list has its own shuffle, so a new list never rewrites earlier days. */
export interface AnswerEra {
  from: number;
  ids: readonly string[];
}

/** How many of the previous list's final answers wait until the end of a new list's first pass, so nothing repeats soon. */
const RECENT = 60;
const eraOrders = new Map<string, string[]>();

/** The answer for a puzzle when the answer list has changed over time. With a single era this is just answerFor. */
export function scheduledAnswer(puzzle: number, eras: readonly AnswerEra[], salt: string): string {
  let k = 0;
  for (let i = 1; i < eras.length; i++) if (eras[i].from <= puzzle) k = i;
  if (k === 0) return answerFor(puzzle, eras[0].ids, salt);

  const { from, ids } = eras[k];
  const sorted = [...ids].sort();
  const index = puzzle - from;
  const cycle = Math.floor(index / sorted.length);
  if (cycle > 0) return cycleOrder(sorted, `${salt}:${from}`, cycle)[index % sorted.length];

  const key = `${salt}:${from}:${sorted.length}`;
  let order = eraOrders.get(key);
  if (!order) {
    const earlier = eras.slice(0, k);
    const recent = new Set(Array.from({ length: Math.min(RECENT, from - 1) }, (_, i) => scheduledAnswer(from - 1 - i, earlier, salt)));
    const shuffled = cycleOrder(sorted, `${salt}:${from}`, 0);
    order = [...shuffled.filter((id) => !recent.has(id)), ...shuffled.filter((id) => recent.has(id))];
    eraOrders.set(key, order);
  }
  return order[index];
}
