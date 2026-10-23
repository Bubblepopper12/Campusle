// Builds src/data/colleges.json from the hand-entered fallback table (scripts/data/colleges-offline.tsv).
// Use it when the College Scorecard API or Wikidata can't be reached. Values are approximate.
// Run: npm run data:offline
import { finalize, loadOfflineColleges } from "./lib/pipeline.ts";

finalize(loadOfflineColleges(), "Offline fallback (hand-entered, approximate). Run `npm run data:build` for real data.", [
  "This is the offline fallback dataset. Run `npm run data:build` with SCORECARD_API_KEY set to replace it with College Scorecard + Wikidata values.",
]);
