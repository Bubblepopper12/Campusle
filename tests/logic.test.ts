import { describe, expect, it } from "vitest";
import { bearingDegrees, compass, distanceMiles } from "../src/lib/geo";
import { LAUNCH_DATE, answerFor, msUntilNextPuzzle, puzzleNumber } from "../src/lib/daily";
import { colorFamily, compareColors, compareLocation, compareNumber } from "../src/lib/feedback";
import { shareText, tileEmoji } from "../src/lib/share";
import { emptyStats, recordGame, visibleStreak } from "../src/lib/stats";
import { COLLEGE_BY_ID } from "../src/lib/data";

const austin = { lat: 30.2849, lon: -97.7341 };
const collegeStation = { lat: 30.6188, lon: -96.3365 };
const seattle = { lat: 47.6553, lon: -122.3035 };

describe("geo", () => {
  it("measures great-circle miles", () => {
    expect(distanceMiles(austin, collegeStation)).toBeGreaterThan(80);
    expect(distanceMiles(austin, collegeStation)).toBeLessThan(90);
    expect(distanceMiles(austin, austin)).toBe(0);
  });
  it("points the right way", () => {
    expect(compass(bearingDegrees(austin, collegeStation))).toBe("E");
    expect(compass(bearingDegrees(austin, seattle))).toBe("NW");
    expect(compass(bearingDegrees(seattle, austin))).toBe("SE");
    expect(compass(359)).toBe("N");
  });
});

describe("daily puzzle", () => {
  const launch = new Date(LAUNCH_DATE.year, LAUNCH_DATE.month - 1, LAUNCH_DATE.day, 0, 0, 1);
  it("numbers days from launch in local time", () => {
    expect(puzzleNumber(launch)).toBe(1);
    expect(puzzleNumber(new Date(LAUNCH_DATE.year, LAUNCH_DATE.month - 1, LAUNCH_DATE.day, 23, 59, 59))).toBe(1);
    expect(puzzleNumber(new Date(LAUNCH_DATE.year, LAUNCH_DATE.month - 1, LAUNCH_DATE.day + 1, 0, 0, 0))).toBe(2);
    // Across a DST change (first Sunday in November in the U.S.) days still count one at a time.
    expect(puzzleNumber(new Date(2026, 10, 2, 12))).toBe(puzzleNumber(new Date(2026, 10, 1, 12)) + 1);
    expect(puzzleNumber(new Date(2026, 0, 1))).toBe(1);
  });
  it("counts down to local midnight", () => {
    expect(msUntilNextPuzzle(new Date(2026, 9, 11, 23, 0, 0))).toBe(3_600_000);
  });
  it("uses every answer once per cycle, the same for everyone", () => {
    const ids = Array.from({ length: 30 }, (_, i) => `school-${i}`);
    const firstCycle = Array.from({ length: 30 }, (_, i) => answerFor(i + 1, ids, "classic"));
    expect(new Set(firstCycle).size).toBe(30);
    expect(answerFor(7, [...ids].reverse(), "classic")).toBe(firstCycle[6]);
    const secondCycle = Array.from({ length: 30 }, (_, i) => answerFor(i + 31, ids, "classic"));
    expect(new Set(secondCycle).size).toBe(30);
    expect(secondCycle[0]).not.toBe(firstCycle[29]);
    expect(secondCycle).not.toEqual(firstCycle);
    expect(answerFor(3, ids, "gridiron")).toBe(answerFor(3, ids, "gridiron"));
  });
});

describe("feedback", () => {
  const ut = COLLEGE_BY_ID.get("university-of-texas-at-austin")!;
  const tamu = COLLEGE_BY_ID.get("texas-a-and-m-university-college-station")!;
  const uw = COLLEGE_BY_ID.get("university-of-washington-seattle-campus")!;

  it("colors location by state and distance", () => {
    const same = compareLocation(tamu, ut);
    expect(same.color).toBe("green");
    expect(same.compass).toBe("W");
    expect(compareLocation(uw, ut).color).toBe("red");
    expect(compareLocation(ut, ut)).toMatchObject({ color: "green", hit: true });
  });

  it("applies the 5% / 25% bands with arrows on yellow and gray", () => {
    const f = String;
    expect(compareNumber(100, 100, "relative", f, "x")).toMatchObject({ color: "green", dir: null });
    expect(compareNumber(96, 100, "relative", f, "x")).toMatchObject({ color: "green", dir: null });
    expect(compareNumber(80, 100, "relative", f, "x")).toMatchObject({ color: "yellow", dir: "up" });
    expect(compareNumber(130, 100, "relative", f, "x")).toMatchObject({ color: "gray", dir: "down" });
    expect(compareNumber(null, 100, "relative", f, "x").color).toBe("missing");
    expect(compareNumber(5000, 0, "relative", f, "x")).toMatchObject({ color: "gray", dir: "down" });
  });

  it("judges years by the answer's age", () => {
    // Answer founded 1876 is 150 years old in 2026: 5% ≈ 7 years, 25% ≈ 37 years.
    expect(compareNumber(1883, 1876, "age", String, "f", 2026).color).toBe("green");
    expect(compareNumber(1850, 1876, "age", String, "f", 2026)).toMatchObject({ color: "yellow", dir: "up" });
    expect(compareNumber(1960, 1876, "age", String, "f", 2026)).toMatchObject({ color: "gray", dir: "down" });
  });

  it("treats titles as small counts", () => {
    expect(compareNumber(0, 0, "count", String, "t").color).toBe("green");
    expect(compareNumber(2, 0, "count", String, "t")).toMatchObject({ color: "yellow", dir: "down" });
    expect(compareNumber(0, 11, "count", String, "t")).toMatchObject({ color: "gray", dir: "up" });
  });

  it("compares team colors by family", () => {
    expect(colorFamily("burnt orange")).toBe("orange");
    expect(colorFamily("Cardinal")).toBe("red");
    const texas = [{ name: "burnt orange", hex: "#BF5700" }, { name: "white", hex: "#FFFFFF" }];
    const tennessee = [{ name: "orange", hex: "#FF8200" }, { name: "white", hex: "#FFFFFF" }];
    const auburn = [{ name: "navy", hex: "#0C2340" }, { name: "orange", hex: "#E87722" }];
    const bama = [{ name: "crimson", hex: "#9E1B32" }, { name: "white", hex: "#FFFFFF" }];
    expect(compareColors(tennessee, texas, false).color).toBe("green");
    expect(compareColors(auburn, texas, false).color).toBe("yellow");
    expect(compareColors(bama, texas, false).color).toBe("gray");
  });
});

describe("share text", () => {
  it("matches the spoiler-free format", () => {
    const rows = [
      [
        { color: "red", dir: null, text: "", aria: "" },
        { color: "yellow", dir: "up", text: "", aria: "" },
        { color: "gray", dir: "down", text: "", aria: "" },
        { color: "gray", dir: "up", text: "", aria: "" },
        { color: "missing", dir: null, text: "", aria: "" },
        { color: "green", dir: null, text: "", aria: "" },
      ],
    ] as const;
    const text = shareText({ title: "Campusle", badge: "🎓", puzzle: 14, rows: rows.map((r) => [...r]), won: true, maxGuesses: 6 });
    expect(text).toBe("Campusle #14 🎓 1/6\n🟥🟨⬇️⬆️⬜🟩\ncampoozel.com");
    expect(shareText({ title: "Campusle", badge: "🎓", puzzle: 2, rows: [], won: false, maxGuesses: 6 })).toContain("X/6");
    expect(tileEmoji({ color: "orange", dir: null, text: "", aria: "" })).toBe("🟧");
  });
});

describe("stats", () => {
  it("tracks streaks and ignores repeats", () => {
    let s = emptyStats();
    s = recordGame(s, 1, true, 3);
    s = recordGame(s, 1, true, 3);
    expect(s.played).toBe(1);
    s = recordGame(s, 2, true, 4);
    expect(s.currentStreak).toBe(2);
    expect(visibleStreak(s, 3)).toBe(2);
    expect(visibleStreak(s, 4)).toBe(0);
    s = recordGame(s, 3, false, 6);
    expect(s).toMatchObject({ played: 3, wins: 2, currentStreak: 0, maxStreak: 2 });
    expect(s.distribution).toEqual([0, 0, 1, 1, 0, 0, 1]);
    s = recordGame(s, 5, true, 1);
    expect(s.currentStreak).toBe(1);
  });
});
