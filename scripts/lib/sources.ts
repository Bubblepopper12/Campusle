// Pure helpers for turning College Scorecard and Wikidata responses into College fields.
// Kept free of network code so they can be unit tested (tests/sources.test.ts).
import type { Control } from "../../src/lib/types.ts";
import { D1, normalizeConference } from "./conferences.ts";

export const SCORECARD_FIELDS = [
  "id",
  "school.name",
  "school.alias",
  "school.city",
  "school.state",
  "location.lat",
  "location.lon",
  "latest.student.size",
  "latest.cost.tuition.in_state",
  "latest.admissions.admission_rate.overall",
  "school.ownership",
] as const;

/** 50 states + DC. Territories are left out of the game. */
export const STATES = new Set(
  "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(
    " ",
  ),
);

export interface ScorecardSchool {
  unitid: string;
  name: string;
  scorecardAliases: string[];
  city: string;
  state: string;
  lat: number;
  lon: number;
  undergrads: number | null;
  tuition: number | null;
  acceptance: number | null;
  control: Control | null;
}

type Row = Record<string, unknown>;
const n = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** One Scorecard result row → our shape, or null if it can't be placed on a U.S. map. */
export function mapScorecardRow(r: Row): ScorecardSchool | null {
  const state = String(r["school.state"] ?? "");
  const lat = n(r["location.lat"]);
  const lon = n(r["location.lon"]);
  if (!STATES.has(state) || lat === null || lon === null) return null;
  const ownership = n(r["school.ownership"]);
  const alias = typeof r["school.alias"] === "string" ? (r["school.alias"] as string) : "";
  return {
    unitid: String(r["id"]),
    name: String(r["school.name"]).trim(),
    scorecardAliases: alias
      .split(/[,|;]/)
      .map((a) => a.trim())
      .filter((a) => a.length > 1 && a.length <= 40),
    city: String(r["school.city"] ?? "").trim(),
    state,
    lat: Math.round(lat * 10000) / 10000,
    lon: Math.round(lon * 10000) / 10000,
    undergrads: n(r["latest.student.size"]),
    tuition: n(r["latest.cost.tuition.in_state"]),
    acceptance: n(r["latest.admissions.admission_rate.overall"]),
    control: ownership === 1 ? "public" : ownership === 2 ? "private" : null,
  };
}

/** SPARQL for a batch of IPEDS unit ids (Wikidata property P1771). */
export function wikidataQuery(unitids: string[]): string {
  return `SELECT ?ipeds ?inception ?mascotLabel ?teamLabel ?leagueLabel ?ownLeagueLabel WHERE {
  VALUES ?ipeds { ${unitids.map((id) => JSON.stringify(id)).join(" ")} }
  ?item wdt:P1771 ?ipeds .
  OPTIONAL { ?item wdt:P571 ?inception . }
  OPTIONAL { ?item wdt:P822 ?mascot . }
  OPTIONAL { ?item wdt:P118 ?ownLeague . }
  OPTIONAL {
    { ?team wdt:P1416 ?item } UNION { ?team wdt:P127 ?item } UNION { ?team wdt:P749 ?item } UNION { ?team wdt:P361 ?item }
    ?team wdt:P118 ?league .
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;
}

export interface WikidataFacts {
  founded: number | null;
  foundedCandidates: number[];
  conference: string | null;
  conferenceLabels: string[];
  mascot: string | null;
}

type Binding = Record<string, { value: string } | undefined>;

const SPORT_SUFFIX = /\s+(football|men's basketball|women's basketball|basketball|baseball|softball|ice hockey|hockey|athletics)$/i;

/** Collapses SPARQL result rows into one set of facts per IPEDS id. */
export function aggregateWikidata(bindings: Binding[]): Map<string, WikidataFacts> {
  const groups = new Map<string, Binding[]>();
  for (const b of bindings) {
    const id = b.ipeds?.value;
    if (id) groups.set(id, [...(groups.get(id) ?? []), b]);
  }
  const out = new Map<string, WikidataFacts>();
  for (const [id, rows] of groups) {
    const years = [...new Set(rows.map((r) => parseInt(r.inception?.value?.replace(/^\+/, "").slice(0, 4) ?? "", 10)).filter((y) => y > 1500))].sort();

    const labels = rows.flatMap((r) => [r.leagueLabel?.value, r.ownLeagueLabel?.value]).filter((l): l is string => !!l && !/^Q\d+$/.test(l));
    const tally = new Map<string, number>();
    for (const l of labels) {
      const c = normalizeConference(l);
      if (c) tally.set(c, (tally.get(c) ?? 0) + 1);
    }
    const isD1 = (c: string) => Object.values(D1).includes(c);
    const conference = [...tally.entries()].sort((a, b) => b[1] - a[1] || Number(isD1(b[0])) - Number(isD1(a[0])))[0]?.[0] ?? null;

    const teams = [...new Set(rows.map((r) => r.teamLabel?.value).filter((t): t is string => !!t && !/^Q\d+$/.test(t)))];
    const program = teams.find((t) => !SPORT_SUFFIX.test(t)) ?? teams[0]?.replace(SPORT_SUFFIX, "");
    const mascotLabel = rows.map((r) => r.mascotLabel?.value).find((m) => m && !/^Q\d+$/.test(m));

    out.set(id, {
      founded: years[0] ?? null,
      foundedCandidates: years,
      conference,
      conferenceLabels: [...new Set(labels)],
      mascot: program ?? mascotLabel ?? null,
    });
  }
  return out;
}
