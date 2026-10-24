// Writes public/archive/ (one page per finished puzzle plus an index) and public/sitemap.xml.
// A GitHub Action runs this every morning and commits the new page; Vercel deploys it.
// Run: npm run archive          Flags: --now=2026-11-01T13:00:00Z   pretend it's a different time
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { answersFor, dayPage, indexPage, lastFinishedPuzzle, loadArchiveData, sitemap } from "./lib/archive.ts";
import { ROOT } from "./lib/pipeline.ts";

const nowArg = process.argv.find((a) => a.startsWith("--now="));
const now = nowArg ? new Date(nowArg.slice("--now=".length)) : new Date();
const last = lastFinishedPuzzle(now);
const data = loadArchiveData();
const days = Array.from({ length: Math.max(last, 0) }, (_, i) => answersFor(i + 1, data));

const dir = join(ROOT, "public", "archive");
mkdirSync(dir, { recursive: true });
let changed = 0;
/** Writes only when the content differs, so the daily job commits just the new day. */
function put(file: string, content: string) {
  if (existsSync(file) && readFileSync(file, "utf8") === content) return;
  writeFileSync(file, content);
  changed++;
}
for (const day of days) put(join(dir, `${day.n}.html`), dayPage(day, last, data));
put(join(dir, "index.html"), indexPage(days, data.colleges.length));
put(join(ROOT, "public", "sitemap.xml"), sitemap(days));

console.log(`Archive: ${days.length} finished puzzles (through #${last}), ${changed} file(s) updated.`);
