import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CLASSIC_ANSWERS, COLLEGES, COLLEGE_BY_ID, TEAMS } from "../src/lib/data";
import { parseAnswerList } from "../src/lib/answers";
import { MODE_CONFIG } from "../src/lib/modes";
import { mapScorecardRow, aggregateWikidata } from "../scripts/lib/sources";
import { normalizeConference } from "../scripts/lib/conferences";

describe("dataset", () => {
  it("has every answer id in the dataset", () => {
    for (const file of ["answers.txt", "answers-hard.txt", "answers-v1.txt", "answers-hard-v1.txt"]) {
      const listed = parseAnswerList(readFileSync(`src/data/${file}`, "utf8"));
      expect(listed.filter((id) => !COLLEGE_BY_ID.has(id)), file).toEqual([]);
    }
    // Normal is kept to well-known schools on purpose; about three months of puzzles before it repeats.
    expect(CLASSIC_ANSWERS.length).toBeGreaterThan(100);
  });
  it("has unique ids and usable coordinates", () => {
    expect(new Set(COLLEGES.map((c) => c.id)).size).toBe(COLLEGES.length);
    for (const c of COLLEGES) {
      expect(Number.isFinite(c.lat) && Number.isFinite(c.lon), c.id).toBe(true);
      expect(c.short.length, c.id).toBeGreaterThan(0);
    }
  });
  it("links every football team to a school", () => {
    expect(TEAMS.length).toBeGreaterThan(120);
    for (const t of TEAMS) expect(COLLEGE_BY_ID.has(t.id), t.id).toBe(true);
    expect(MODE_CONFIG.gridiron.pool.length).toBe(TEAMS.length);
  });
});

describe("build-data parsing", () => {
  it("maps a Scorecard row", () => {
    const row = {
      id: 228778,
      "school.name": "The University of Texas at Austin",
      "school.alias": "UT Austin, Texas",
      "school.city": "Austin",
      "school.state": "TX",
      "location.lat": 30.282825,
      "location.lon": -97.738273,
      "latest.student.size": 41309,
      "latest.cost.tuition.in_state": 11678,
      "latest.admissions.admission_rate.overall": 0.2851,
      "school.ownership": 1,
    };
    expect(mapScorecardRow(row)).toMatchObject({ unitid: "228778", control: "public", scorecardAliases: ["UT Austin", "Texas"], lat: 30.2828 });
    expect(mapScorecardRow({ ...row, "school.state": "PR" })).toBeNull();
  });
  it("aggregates Wikidata rows", () => {
    const v = (value: string) => ({ value });
    const facts = aggregateWikidata([
      { ipeds: v("228778"), inception: v("1883-09-15T00:00:00Z"), teamLabel: v("Texas Longhorns"), leagueLabel: v("Southeastern Conference") },
      { ipeds: v("228778"), inception: v("1881-01-01T00:00:00Z"), teamLabel: v("Texas Longhorns football"), leagueLabel: v("Southeastern Conference") },
      { ipeds: v("164465"), inception: v("1821-01-01T00:00:00Z"), ownLeagueLabel: v("New England Small College Athletic Conference") },
    ]);
    expect(facts.get("228778")).toMatchObject({ founded: 1881, conference: "SEC", mascot: "Texas Longhorns" });
    expect(facts.get("164465")).toMatchObject({ founded: 1821, conference: "Division III", mascot: null });
  });
  it("normalizes conference names", () => {
    expect(normalizeConference("Big Ten Conference")).toBe("Big Ten");
    expect(normalizeConference("Southern Intercollegiate Athletic Conference")).toBe("Division II");
    expect(normalizeConference("Something Else")).toBeNull();
  });
});
