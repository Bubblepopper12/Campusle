// Shared steps for both data scripts: aliases, overrides, football data, the report, and writing JSON.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { College, FootballTeam, TeamColor } from "../../src/lib/types.ts";
import { parseAnswerList } from "../../src/lib/answers.ts";
import { slugify } from "../../src/lib/slug.ts";
import { KNOWN_SHORT } from "./conferences.ts";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DATA_DIR = join(ROOT, "src", "data");
const path = (...p: string[]) => join(ROOT, ...p);

export { slugify };

export function readJson<T>(file: string, fallback: T): T {
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

/** Reads a tab-separated file, skipping blank lines and # comments. */
export function readTsv(file: string): string[][] {
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => l.split("\t").map((c) => c.trim()));
}

export const num = (s: string | undefined): number | null => {
  if (s === undefined || s === "" || s.toLowerCase() === "null") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/** Gives every school an id from its official name, adding the state (then a counter) on collisions. */
export function assignIds<T extends { name: string; state: string }>(rows: T[]): (T & { id: string })[] {
  const seen = new Map<string, number>();
  const base = rows.map((r) => slugify(r.name));
  base.forEach((b) => seen.set(b, (seen.get(b) ?? 0) + 1));
  const used = new Set<string>();
  return rows.map((r, i) => {
    let id = base[i];
    if ((seen.get(id) ?? 0) > 1) id = `${id}-${r.state.toLowerCase()}`;
    let n = 2;
    const stem = id;
    while (used.has(id)) id = `${stem}-${n++}`;
    used.add(id);
    return { ...r, id };
  });
}

/** A readable short name for schools that have none in aliases.json. */
export function autoShort(name: string): string {
  let s = name
    .replace(/^The /, "")
    .replace(/[- ](Main|Pittsburgh|Seattle|Norman) Campus$/, "")
    .replace(/ Campus Immersion$/, "");
  s = s.replace(/^University of California-/, "UC ");
  if (s.startsWith("University of ") && s.length > 24) s = s.slice("University of ".length);
  return s;
}

interface AliasEntry {
  short?: string;
  aliases?: string[];
}

/** Merges src/data/aliases.json (curated short names and aliases) into the schools. */
export function applyAliases(colleges: College[]): College[] {
  const curated = readJson<Record<string, AliasEntry>>(join(DATA_DIR, "aliases.json"), {});
  return colleges.map((c) => {
    const entry = curated[c.id];
    const short = entry?.short ?? c.short ?? autoShort(c.name);
    const all = [...(entry?.aliases ?? []), ...c.aliases];
    const seen = new Set([short.toLowerCase(), c.name.toLowerCase()]);
    const aliases = all.filter((a) => {
      const k = a.toLowerCase();
      if (!a || a.length > 60 || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return { ...c, short, aliases };
  });
}

interface OverridesFile {
  colleges?: Record<string, Partial<College> & { exclude?: boolean }>;
  football?: Record<string, Partial<FootballTeam> & { exclude?: boolean }>;
}

const REQUIRED_NEW: (keyof College)[] = ["name", "city", "state", "lat", "lon"];

/** Applies src/data/overrides.json last. An override for an unknown id with name/city/state/lat/lon adds a school. */
export function applyCollegeOverrides(colleges: College[], log: string[]): College[] {
  const o = readJson<OverridesFile>(join(DATA_DIR, "overrides.json"), {}).colleges ?? {};
  const byId = new Map(colleges.map((c) => [c.id, c]));
  for (const [id, patch] of Object.entries(o)) {
    if (id.startsWith("_")) continue;
    const { exclude, ...fields } = patch;
    const current = byId.get(id);
    if (exclude) {
      byId.delete(id);
      continue;
    }
    if (current) {
      byId.set(id, { ...current, ...fields, id });
    } else if (REQUIRED_NEW.every((k) => fields[k] !== undefined)) {
      const defaults: College = {
        id,
        name: fields.name!,
        city: fields.city!,
        state: fields.state!,
        lat: fields.lat!,
        lon: fields.lon!,
        short: autoShort(fields.name!),
        aliases: [],
        undergrads: null,
        tuition: null,
        acceptance: null,
        control: null,
        founded: null,
        conference: null,
        mascot: null,
      };
      byId.set(id, { ...defaults, ...fields, id });
    } else {
      log.push(`overrides.json: no school with id "${id}" (to add one, include name, city, state, lat and lon)`);
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function parseColors(s: string): TeamColor[] {
  return s
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const i = p.lastIndexOf(":");
      return { name: p.slice(0, i).trim(), hex: p.slice(i + 1).trim().toUpperCase() };
    });
}

/** Reads the hand-curated football table and applies football overrides. */
export function loadFootball(log: string[]): FootballTeam[] {
  const rows = readTsv(path("scripts", "data", "football.tsv"));
  const teams = new Map<string, FootballTeam>();
  for (const [id, conference, stadium, capacity, firstSeason, titles, colors] of rows) {
    teams.set(id, {
      id,
      conference,
      stadium,
      capacity: num(capacity),
      firstSeason: num(firstSeason),
      titles: num(titles),
      colors: parseColors(colors ?? ""),
    });
  }
  const o = readJson<OverridesFile>(join(DATA_DIR, "overrides.json"), {}).football ?? {};
  for (const [id, patch] of Object.entries(o)) {
    if (id.startsWith("_")) continue;
    const { exclude, ...fields } = patch;
    if (exclude) teams.delete(id);
    else if (teams.has(id)) teams.set(id, { ...teams.get(id)!, ...fields, id });
    else log.push(`overrides.json (football): no team with id "${id}" in scripts/data/football.tsv`);
  }
  return [...teams.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function readAnswerIds(): string[] {
  return parseAnswerList(readFileSync(join(DATA_DIR, "answers.txt"), "utf8"));
}

/** Lists every school with missing or suspicious values. Answer-list schools (★) come first. */
export function buildReport(colleges: College[], teams: FootballTeam[], extra: string[] = []): string[] {
  const year = new Date().getFullYear();
  const answers = new Set(readAnswerIds());
  const byId = new Map(colleges.map((c) => [c.id, c]));
  const issues = new Map<string, string[]>();
  const add = (id: string, msg: string) => issues.set(id, [...(issues.get(id) ?? []), msg]);

  for (const c of colleges) {
    const missing = (["undergrads", "tuition", "acceptance", "control", "founded", "conference", "mascot"] as const).filter(
      (k) => c[k] === null || c[k] === undefined || c[k] === "",
    );
    if (missing.length) add(c.id, `missing ${missing.join(", ")}`);
    if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon)) add(c.id, "missing coordinates");
    else if (c.lat < 17 || c.lat > 72 || c.lon < -180 || c.lon > -64) add(c.id, `coordinates outside the U.S. (${c.lat}, ${c.lon})`);
    if (c.acceptance !== null && (c.acceptance < 0.02 || c.acceptance > 1)) add(c.id, `acceptance rate ${c.acceptance}`);
    if (c.undergrads !== null && (c.undergrads < 300 || c.undergrads > 80000)) add(c.id, `undergrads ${c.undergrads}`);
    if (c.tuition !== null && c.tuition === 0) add(c.id, "tuition is $0 (fine for service academies)");
    else if (c.tuition !== null && (c.tuition < 1000 || c.tuition > 80000)) add(c.id, `tuition $${c.tuition}`);
    if (c.founded !== null && (c.founded < 1636 || c.founded > year)) add(c.id, `founded ${c.founded}`);
    if (c.conference && !KNOWN_SHORT.has(c.conference)) add(c.id, `unrecognized conference "${c.conference}"`);
  }

  const shorts = new Map<string, string[]>();
  for (const c of colleges) shorts.set(c.short.toLowerCase(), [...(shorts.get(c.short.toLowerCase()) ?? []), c.id]);
  for (const ids of shorts.values()) if (ids.length > 1) ids.forEach((id) => add(id, `short name "${byId.get(id)!.short}" is shared by ${ids.length} schools`));

  const lines: string[] = [];
  const missingAnswers = [...answers].filter((id) => !byId.has(id));
  if (missingAnswers.length) {
    lines.push(`\nANSWER LIST IDS NOT IN THE DATASET (${missingAnswers.length}). Fix src/data/answers.txt:`);
    for (const id of missingAnswers) lines.push(`  ✗ ${id}${suggest(id, colleges)}`);
  }

  for (const t of teams) {
    const where = `football ${t.id}`;
    if (!byId.has(t.id)) add(t.id, `${where}: no school with this id`);
    if (t.capacity === null || t.capacity < 5000 || t.capacity > 115000) add(t.id, `${where}: capacity ${t.capacity}`);
    if (t.firstSeason === null || t.firstSeason < 1869 || t.firstSeason > year) add(t.id, `${where}: first season ${t.firstSeason}`);
    if (t.titles === null || t.titles < 0) add(t.id, `${where}: titles ${t.titles}`);
    if (!t.colors.length || t.colors.some((c) => !/^#[0-9A-F]{6}$/.test(c.hex))) add(t.id, `${where}: bad colors`);
    if (!KNOWN_SHORT.has(t.conference)) add(t.id, `${where}: unrecognized conference "${t.conference}"`);
  }

  const sorted = [...issues.entries()].sort(([a], [b]) => Number(answers.has(b)) - Number(answers.has(a)) || a.localeCompare(b));
  if (sorted.length) {
    lines.push(`\nSCHOOLS WITH MISSING OR SUSPICIOUS VALUES (${sorted.length}). ★ = on the answer list. Fix in src/data/overrides.json:`);
    for (const [id, msgs] of sorted) lines.push(`  ${answers.has(id) ? "★" : " "} ${id}: ${msgs.join("; ")}`);
  }
  if (extra.length) lines.push("\nOTHER NOTES:", ...extra.map((e) => `  - ${e}`));

  const answerCount = [...answers].filter((id) => byId.has(id)).length;
  lines.unshift(
    `Campusle data report: ${colleges.length} guessable schools, ${answerCount} Classic answers, ${teams.length} Gridiron teams.`,
  );
  if (!sorted.length && !missingAnswers.length) lines.push("\nNo problems found. ✓");
  return lines;
}

function suggest(id: string, colleges: College[]): string {
  const words = id.split("-").filter((w) => w.length > 3 && !["university", "college", "state", "campus", "main"].includes(w));
  const hits = colleges.filter((c) => words.length && words.every((w) => c.id.includes(w))).slice(0, 3);
  return hits.length ? `  (did you mean ${hits.map((h) => h.id).join(", ")}?)` : "";
}

/** Writes JSON with one school per line so diffs stay readable. */
export function writeDataFile(file: string, header: Record<string, string>, key: string, rows: unknown[]) {
  const head = Object.entries(header)
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join("\n");
  const body = rows.map((r) => `    ${JSON.stringify(r)}`).join(",\n");
  writeFileSync(file, `{\n${head}\n  ${JSON.stringify(key)}: [\n${body}\n  ]\n}\n`);
}

/** Final shared step: aliases, overrides, football, write both files, print the report. */
export function finalize(colleges: College[], source: string, notes: string[] = []) {
  const log = [...notes];
  const merged = applyCollegeOverrides(applyAliases(colleges), log);
  const ids = new Set(merged.map((c) => c.id));
  const teams = loadFootball(log);
  const generatedAt = new Date().toISOString();
  writeDataFile(join(DATA_DIR, "colleges.json"), { source, generatedAt }, "colleges", merged);
  writeDataFile(
    join(DATA_DIR, "football.json"),
    { source: "Hand-curated (scripts/data/football.tsv) + overrides", generatedAt },
    "teams",
    teams.filter((t) => ids.has(t.id)),
  );
  const report = buildReport(merged, teams, log);
  writeFileSync(path("data-report.txt"), report.join("\n") + "\n");
  console.log(report.join("\n"));
  console.log(`\nWrote src/data/colleges.json, src/data/football.json and data-report.txt`);
}
