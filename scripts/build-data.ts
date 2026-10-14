// Builds src/data/colleges.json from real sources:
//   - U.S. Department of Education College Scorecard API: location, enrollment, tuition, acceptance rate, public/private
//   - Wikidata: founding year, athletic conference, mascot / team name
// Then merges src/data/aliases.json and src/data/overrides.json and prints a report of missing or suspicious values.
//
// Run: SCORECARD_API_KEY=xxxx npm run data:build      (free key: https://api.data.gov/signup/)
// Flags: --refresh   ignore the local download cache in scripts/.cache/
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { College } from "../src/lib/types.ts";
import { ROOT, assignIds, autoShort, finalize } from "./lib/pipeline.ts";
import { SCORECARD_FIELDS, aggregateWikidata, mapScorecardRow, wikidataQuery, type ScorecardSchool } from "./lib/sources.ts";

const CACHE = join(ROOT, "scripts", ".cache");
const REFRESH = process.argv.includes("--refresh");
const SCORECARD_URL = "https://api.data.gov/ed/collegescorecard/v1/schools.json";
const WIKIDATA_URL = "https://query.wikidata.org/sparql";
const USER_AGENT = "CampusleDataBuilder/1.0 (https://campusle.com; data build script)";

function loadDotEnv() {
  const file = join(ROOT, ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url: string, init: RequestInit = {}, tries = 5): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;
      if (attempt >= tries || ![429, 500, 502, 503, 504].includes(res.status)) {
        throw new Error(`${res.status} ${res.statusText} for ${url.replace(/api_key=[^&]+/, "api_key=***")}\n${(await res.text()).slice(0, 300)}`);
      }
    } catch (err) {
      if (attempt >= tries) throw err;
    }
    const wait = 2 ** attempt * 1000;
    console.log(`  retrying in ${wait / 1000}s…`);
    await sleep(wait);
  }
}

function cached<T>(name: string, produce: () => Promise<T>): Promise<T> {
  const file = join(CACHE, name);
  if (!REFRESH && existsSync(file)) {
    console.log(`Using cached ${name} (pass --refresh to download again)`);
    return Promise.resolve(JSON.parse(readFileSync(file, "utf8")) as T);
  }
  return produce().then((data) => {
    mkdirSync(CACHE, { recursive: true });
    writeFileSync(file, JSON.stringify(data));
    return data;
  });
}

/** Every operating, public or private nonprofit, predominantly bachelor's-granting school with 300+ undergrads. */
async function fetchScorecard(apiKey: string): Promise<Record<string, unknown>[]> {
  return cached("scorecard.json", async () => {
    const rows: Record<string, unknown>[] = [];
    for (let page = 0; ; page++) {
      const params = new URLSearchParams({
        api_key: apiKey,
        "school.degrees_awarded.predominant": "3",
        "school.operating": "1",
        "school.ownership": "1,2",
        "latest.student.size__range": "300..",
        fields: SCORECARD_FIELDS.join(","),
        per_page: "100",
        page: String(page),
      });
      const res = await fetchWithRetry(`${SCORECARD_URL}?${params}`);
      const json = (await res.json()) as { metadata: { total: number }; results: Record<string, unknown>[] };
      rows.push(...json.results);
      console.log(`  Scorecard page ${page + 1}: ${rows.length}/${json.metadata.total}`);
      if (!json.results.length || rows.length >= json.metadata.total) break;
      await sleep(250);
    }
    return rows;
  });
}

async function fetchWikidata(unitids: string[]): Promise<Record<string, { value: string }>[]> {
  return cached("wikidata.json", async () => {
    const bindings: Record<string, { value: string }>[] = [];
    const BATCH = 150;
    for (let i = 0; i < unitids.length; i += BATCH) {
      const res = await fetchWithRetry(WIKIDATA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/sparql-results+json",
          "User-Agent": USER_AGENT,
        },
        body: new URLSearchParams({ query: wikidataQuery(unitids.slice(i, i + BATCH)) }),
      });
      const json = (await res.json()) as { results: { bindings: Record<string, { value: string }>[] } };
      bindings.push(...json.results.bindings);
      console.log(`  Wikidata: ${Math.min(i + BATCH, unitids.length)}/${unitids.length} schools`);
      await sleep(1000);
    }
    return bindings;
  });
}

async function main() {
  loadDotEnv();
  const apiKey = process.env.SCORECARD_API_KEY;
  if (!apiKey) {
    console.error("Set SCORECARD_API_KEY (free at https://api.data.gov/signup/), in your shell or a .env file.");
    console.error("No network or key? `npm run data:offline` builds the approximate offline dataset instead.");
    process.exit(1);
  }

  console.log("Downloading College Scorecard…");
  const schools = (await fetchScorecard(apiKey)).map(mapScorecardRow).filter((s): s is ScorecardSchool => s !== null);
  console.log(`  ${schools.length} schools in the 50 states + DC`);

  console.log("Querying Wikidata…");
  const facts = aggregateWikidata(await fetchWikidata(schools.map((s) => s.unitid)));

  const notes: string[] = [];
  const colleges: College[] = assignIds(schools).map((s) => {
    const f = facts.get(s.unitid);
    if (f && f.foundedCandidates.length > 1 && f.foundedCandidates.at(-1)! - f.foundedCandidates[0] > 5) {
      notes.push(`${s.id}: Wikidata lists several founding years (${f.foundedCandidates.join(", ")}); using ${f.founded}`);
    }
    if (f && !f.conference && f.conferenceLabels.length) {
      notes.push(`${s.id}: conference labels not recognized: ${f.conferenceLabels.join(" | ")}`);
    }
    return {
      id: s.id,
      name: s.name,
      short: autoShort(s.name),
      aliases: s.scorecardAliases,
      city: s.city,
      state: s.state,
      lat: s.lat,
      lon: s.lon,
      undergrads: s.undergrads,
      tuition: s.tuition,
      acceptance: s.acceptance,
      control: s.control,
      founded: f?.founded ?? null,
      conference: f?.conference ?? null,
      mascot: f?.mascot ?? null,
    };
  });

  finalize(colleges, "U.S. Department of Education College Scorecard + Wikidata", notes);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
