import type { College } from "./types";

/** Lowercases, strips accents and punctuation, and spells out "&" and "St." so "St. John's" finds "Saint Johns". */
export function normalize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w === "st" ? "saint" : w === "univ" ? "university" : w === "u" ? "university" : w))
    .join(" ");
}

interface Entry {
  college: College;
  keys: { text: string; tokens: string[]; weight: number }[];
  boost: number;
}

/** True when a and b differ by at most one edit (insert, delete, substitute or swap). */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

const SKIP = new Set(["of", "the", "at", "in", "and"]);

/** q is a prefix of t, or (for 4+ letters) a prefix with one typo. */
function prefixMatch(q: string, t: string, fuzzy: boolean): boolean {
  if (t.startsWith(q)) return true;
  if (!fuzzy || q.length < 4) return false;
  for (const len of [q.length - 1, q.length, q.length + 1]) {
    if (len <= t.length && withinOneEdit(q, t.slice(0, len))) return true;
  }
  return false;
}

const tokenMatches = (q: string, tokens: string[], fuzzy: boolean) => tokens.some((t) => prefixMatch(q, t, fuzzy));

function scoreKey(q: string, qTokens: string[], key: Entry["keys"][number]): number {
  if (key.text === q) return 100;
  if (key.text.startsWith(q)) return 85 - Math.min(10, key.text.length - q.length) * 0.5;
  const words = qTokens.filter((t) => !SKIP.has(t));
  if (!words.length) return 0;
  // Fewer leftover words = closer match ("michgan" prefers "Michigan" over "Michigan State").
  const extra = Math.min(6, (key.tokens.length - words.length) * 2);
  if (words.every((w) => tokenMatches(w, key.tokens, false))) return 65 - extra;
  if (key.text.includes(q)) return 50;
  if (words.every((w) => tokenMatches(w, key.tokens, true))) return 35 - extra;
  return 0;
}

export class SchoolSearch {
  private entries: Entry[];

  constructor(colleges: College[], featured: Set<string> = new Set()) {
    this.entries = colleges.map((c) => {
      const keys = [
        { text: c.short, weight: 4 },
        ...c.aliases.map((a) => ({ text: a, weight: 3 })),
        { text: c.name, weight: 0 },
      ].map((k) => {
        const text = normalize(k.text);
        return { text, tokens: text.split(" "), weight: k.weight };
      });
      // Well-known (answer list) and bigger schools win ties.
      const boost = (featured.has(c.id) ? 6 : 0) + Math.min(4, Math.log10(Math.max(c.undergrads ?? 1000, 1)) - 2);
      return { college: c, keys, boost };
    });
  }

  search(query: string, limit = 8): College[] {
    const q = normalize(query);
    if (!q) return [];
    const qTokens = q.split(" ");
    const scored: { c: College; s: number }[] = [];
    for (const e of this.entries) {
      let best = 0;
      for (const k of e.keys) {
        const s = scoreKey(q, qTokens, k);
        if (s > 0) best = Math.max(best, s + k.weight);
      }
      if (best > 0) scored.push({ c: e.college, s: best + e.boost });
    }
    scored.sort((a, b) => b.s - a.s || a.c.short.localeCompare(b.c.short));
    return scored.slice(0, limit).map((x) => x.c);
  }
}
