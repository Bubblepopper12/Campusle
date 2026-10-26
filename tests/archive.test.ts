import { describe as group, expect, it } from "vitest";
import { answersFor, dayPage, describe, lastFinishedPuzzle, loadArchiveData, puzzleDate } from "../scripts/lib/archive";
import { LAUNCH_DATE } from "../src/lib/daily";
import { MODE_CONFIG } from "../src/lib/modes";

const data = loadArchiveData();
const HOUR = 3_600_000;
const launch = Date.UTC(LAUNCH_DATE.year, LAUNCH_DATE.month - 1, LAUNCH_DATE.day);

/** The puzzle being played right now in the last time zone to reach midnight (UTC-12). */
const latestZonePuzzle = (t: number) => Math.floor((t - 12 * HOUR - launch) / (24 * HOUR)) + 1;

group("archive", () => {
  it("publishes a day only after it has ended in every time zone", () => {
    expect(lastFinishedPuzzle(new Date("2026-10-24T11:59:00Z"))).toBe(12);
    expect(lastFinishedPuzzle(new Date("2026-10-24T12:00:00Z"))).toBe(13);
    for (let t = launch; t < launch + 400 * 24 * HOUR; t += 7 * HOUR + 13 * 60_000) {
      expect(lastFinishedPuzzle(new Date(t))).toBeLessThan(latestZonePuzzle(t));
    }
  });

  it("dates puzzles from launch day", () => {
    expect(puzzleDate(1).toISOString().slice(0, 10)).toBe("2026-10-11");
    expect(puzzleDate(13).toISOString().slice(0, 10)).toBe("2026-10-23");
  });

  it("matches the game's answers", () => {
    const day = answersFor(13, data);
    expect(data.classic[0].ids).toContain(day.classic.id);
    expect(data.hard[0].ids).toContain(day.hard.id);
    expect(answersFor(20, data).classic.id).toBe(MODE_CONFIG.classic.answerOn(20));
    expect(answersFor(20, data).hard.id).toBe(MODE_CONFIG.hard.answerOn(20));
  });

  it("writes clean text for every answer school", () => {
    for (const id of [...data.classic, ...data.hard].flatMap((e) => e.ids)) {
      const text = describe(data.byId.get(id)!, data, id).join(" ");
      expect(text, id).not.toMatch(/undefined|NaN|null|Infinity/);
      expect(text.length, id).toBeGreaterThan(200);
    }
  });

  it("escapes school names in the page", () => {
    const html = dayPage(answersFor(1, data), 5, data);
    expect(html).not.toMatch(/&(?![a-z]+;|#\d+;)/);
  });
});
