import { describe, expect, it } from "vitest";
import { COLLEGE_BY_ID, HARD_ANSWERS, CLASSIC_ANSWERS, PLAYERS, PLAYER_BY_ID, conferenceOf } from "../src/lib/data";
import { comparePosition, evaluatePlayer } from "../src/lib/feedback";
import { MODES, MODE_CONFIG, modeFromHash } from "../src/lib/modes";
import { Search } from "../src/lib/search";
import { answerFor, scheduledAnswer } from "../src/lib/daily";
import { CURRENT_LIST_FROM } from "../src/lib/answers";
import { CLASSIC_ERAS, HARD_ERAS } from "../src/lib/data";

const short = (id: string) => COLLEGE_BY_ID.get(id)!.short;

describe("modes", () => {
  it("routes hashes, keeping old Gridiron links working", () => {
    expect(modeFromHash("#football")).toBe("gridiron");
    expect(modeFromHash("#gridiron")).toBe("gridiron");
    expect(modeFromHash("#hard")).toBe("hard");
    expect(modeFromHash("#players")).toBe("players");
    expect(modeFromHash("")).toBeNull();
    expect(MODE_CONFIG.gridiron.name).toBe("Football");
  });

  it("has a valid daily answer in every mode", () => {
    for (const m of MODES) {
      const cfg = MODE_CONFIG[m];
      expect(cfg.answers.length, m).toBeGreaterThan(100);
      for (let day = 1; day <= 30; day++) expect(cfg.byId.has(cfg.answerOn(day)), `${m} day ${day}`).toBe(true);
    }
  });

  it("keeps Hard answers niche: none are on the Classic list", () => {
    const classic = new Set(CLASSIC_ANSWERS);
    expect(HARD_ANSWERS.filter((id) => classic.has(id))).toEqual([]);
  });
});

describe("players", () => {
  it("links every player to known schools", () => {
    expect(PLAYERS.length).toBeGreaterThan(120);
    for (const p of PLAYERS) {
      for (const s of p.schools) expect(COLLEGE_BY_ID.has(s), `${p.name}: ${s}`).toBe(true);
      expect(p.jersey >= 0 && p.jersey <= 99, p.name).toBe(true);
    }
  });

  it("scores a guess against the answer", () => {
    const tebow = PLAYER_BY_ID.get("tim-tebow")!;
    const burrow = PLAYER_BY_ID.get("joe-burrow")!;
    const [school, pos, season, heisman, titles, jersey] = evaluatePlayer(tebow, burrow, short, conferenceOf);
    expect(school).toMatchObject({ color: "yellow", text: "Florida" }); // Florida and LSU are both SEC
    expect(pos.color).toBe("green");
    expect(season).toMatchObject({ color: "gray", dir: "up" }); // 2009 → 2019
    expect(heisman).toMatchObject({ color: "green", text: "Yes" });
    expect(titles).toMatchObject({ color: "yellow", dir: "down" }); // 2 → 1
    expect(jersey).toMatchObject({ color: "gray", dir: "down", text: "#15" }); // 15 → 9
  });

  it("matches transfers and sides of the ball", () => {
    const kyler = PLAYER_BY_ID.get("kyler-murray")!;
    const manziel = PLAYER_BY_ID.get("johnny-manziel")!;
    expect(evaluatePlayer(kyler, manziel, short, conferenceOf)[0].color).toBe("yellow"); // both played at Texas A&M
    expect(comparePosition("WR", "TE").color).toBe("yellow");
    expect(comparePosition("WR", "LB").color).toBe("gray");
    expect(comparePosition("ATH", "DB").color).toBe("yellow");
  });

  it("finds players by name and nickname", () => {
    const search = new Search(MODE_CONFIG.players.pool, MODE_CONFIG.players.searchBoost);
    expect(search.search("johnny football")[0].id).toBe("johnny-manziel");
    expect(search.search("arch")[0].id).toBe("arch-manning");
    expect(search.search("jeremiah smith")[0].id).toBe("jeremiah-smith");
    expect(search.search("trinidad")[0].id).toBe("trinidad-chambliss");
    expect(search.search("RG3")[0].id).toBe("robert-griffin-iii");
  });

  it("keeps past puzzles when the answer lists change", () => {
    for (const [mode, eras] of [["classic", CLASSIC_ERAS], ["hard", HARD_ERAS]] as const) {
      const cfg = MODE_CONFIG[mode];
      for (let day = 1; day < CURRENT_LIST_FROM; day++) expect(cfg.answerOn(day), `${mode} #${day}`).toBe(answerFor(day, eras[0].ids, mode));
      const used = new Set<string>();
      for (let day = CURRENT_LIST_FROM; day < CURRENT_LIST_FROM + eras[1].ids.length; day++) {
        const id = cfg.answerOn(day);
        expect(eras[1].ids, `${mode} #${day}`).toContain(id);
        expect(used.has(id), `${mode} #${day} repeats`).toBe(false);
        used.add(id);
      }
    }
  });

  it("doesn't bring back recent answers right after a list change", () => {
    const recent = new Set(Array.from({ length: CURRENT_LIST_FROM - 1 }, (_, i) => scheduledAnswer(i + 1, CLASSIC_ERAS, "classic")));
    for (let day = CURRENT_LIST_FROM; day < CURRENT_LIST_FROM + 60; day++) expect(recent.has(MODE_CONFIG.classic.answerOn(day)), `#${day}`).toBe(false);
  });
});
