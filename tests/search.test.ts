import { describe, expect, it } from "vitest";
import { COLLEGES, CLASSIC_ANSWERS } from "../src/lib/data";
import { SchoolSearch, normalize } from "../src/lib/search";

const search = new SchoolSearch(COLLEGES, new Set(CLASSIC_ANSWERS));
const top = (q: string) => search.search(q, 5)[0]?.id;

describe("autocomplete", () => {
  it("normalizes punctuation and saints", () => {
    expect(normalize("St. John's")).toBe("saint johns");
    expect(normalize("Texas A&M")).toBe("texas a and m");
  });
  it.each([
    ["UT", "university-of-texas-at-austin"],
    ["UT Austin", "university-of-texas-at-austin"],
    ["Texas", "university-of-texas-at-austin"],
    ["A&M", "texas-a-and-m-university-college-station"],
    ["Penn", "university-of-pennsylvania"],
    ["penn st", "pennsylvania-state-university-main-campus"],
    ["ole miss", "university-of-mississippi"],
    ["st johns", "st-johns-university-new-york"],
    ["Vanderbuilt", "vanderbilt-university"],
    ["michgan", "university-of-michigan-ann-arbor"],
    ["the u", "university-of-miami"],
    ["MIT", "massachusetts-institute-of-technology"],
    ["UCLA", "university-of-california-los-angeles"],
    ["Bama", "university-of-alabama"],
    ["SEMO", "southeast-missouri-state-university"],
    ["UMKC", "university-of-missouri-kansas-city"],
    ["geneseo", "suny-college-at-geneseo"],
    ["evergreen", "evergreen-state-college"],
    ["barnard", "barnard-college"],
    ["cornell college", "cornell-college"],
  ])("%s → %s", (q, id) => {
    expect(top(q)).toBe(id);
  });
  it("doesn't match short abbreviations inside words", () => {
    expect(search.search("usc", 5).map((c) => c.id)).not.toContain("university-of-alabama");
  });
  it("returns nothing for gibberish", () => {
    expect(search.search("zzqxj")).toEqual([]);
  });
});
