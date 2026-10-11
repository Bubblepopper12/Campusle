// Builds src/data/colleges.json from the hand-entered fallback table (scripts/data/colleges-offline.tsv).
// Use it when the College Scorecard API or Wikidata can't be reached. Values are approximate.
// Run: npm run data:offline
import { join } from "node:path";
import type { College, Control } from "../src/lib/types.ts";
import { ROOT, assignIds, autoShort, finalize, num, readTsv } from "./lib/pipeline.ts";

const rows = readTsv(join(ROOT, "scripts", "data", "colleges-offline.tsv")).map(
  ([name, city, state, lat, lon, undergrads, tuition, acceptance, control, founded, conference, mascot]) => ({
    name,
    city,
    state,
    lat: num(lat)!,
    lon: num(lon)!,
    undergrads: num(undergrads),
    tuition: num(tuition),
    acceptance: num(acceptance),
    control: (control === "public" || control === "private" ? control : null) as Control | null,
    founded: num(founded),
    conference: conference || null,
    mascot: mascot || null,
  }),
);

const colleges: College[] = assignIds(rows).map((r) => ({ ...r, short: autoShort(r.name), aliases: [] }));

finalize(colleges, "Offline fallback (hand-entered, approximate). Run `npm run data:build` for real data.", [
  "This is the offline fallback dataset. Run `npm run data:build` with SCORECARD_API_KEY set to replace it with College Scorecard + Wikidata values.",
]);
