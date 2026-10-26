// Builds the static puzzle archive: one page per finished day with the Classic and Hard answers and a short
// write-up computed from the school data, plus the archive index and sitemap. Used by scripts/build-archive.ts.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { College, CollegesFile, FootballFile } from "../../src/lib/types.ts";
import { CURRENT_LIST_FROM, parseAnswerList } from "../../src/lib/answers.ts";
import { LAUNCH_DATE, scheduledAnswer, type AnswerEra } from "../../src/lib/daily.ts";
import { formatInt, percent } from "../../src/lib/format.ts";
import { distanceMiles } from "../../src/lib/geo.ts";
import { hashString } from "../../src/lib/rng.ts";
import { ROOT } from "./pipeline.ts";

const DAY_MS = 86_400_000;
const LAUNCH_UTC = Date.UTC(LAUNCH_DATE.year, LAUNCH_DATE.month - 1, LAUNCH_DATE.day);
export const SITE = "https://campusle.com";

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut",
  DE: "Delaware", DC: "Washington, D.C.", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

/** Conference labels that describe a division rather than a real league, so ranking "within" them means nothing. */
const NOT_A_LEAGUE = new Set(["Division I", "Division II", "Division III", "NAIA", "None", "Independent", "USCAA", "NCCAA"]);

export interface ArchiveData {
  colleges: College[];
  byId: Map<string, College>;
  conferenceOf: (id: string) => string | null;
  classic: AnswerEra[];
  hard: AnswerEra[];
}

/** Loads the same data the game bundles, without Vite. */
export function loadArchiveData(): ArchiveData {
  const dir = join(ROOT, "src", "data");
  const colleges = (JSON.parse(readFileSync(join(dir, "colleges.json"), "utf8")) as CollegesFile).colleges;
  const byId = new Map(colleges.map((c) => [c.id, c]));
  const teams = new Map((JSON.parse(readFileSync(join(dir, "football.json"), "utf8")) as FootballFile).teams.map((t) => [t.id, t]));
  const list = (file: string) => parseAnswerList(readFileSync(join(dir, file), "utf8")).filter((id) => byId.has(id));
  return {
    colleges,
    byId,
    conferenceOf: (id) => teams.get(id)?.conference ?? byId.get(id)?.conference ?? null,
    classic: [
      { from: 1, ids: list("answers-v1.txt") },
      { from: CURRENT_LIST_FROM, ids: list("answers.txt") },
    ],
    hard: [
      { from: 1, ids: list("answers-hard-v1.txt") },
      { from: CURRENT_LIST_FROM, ids: list("answers-hard.txt") },
    ],
  };
}

/** Midnight UTC of the puzzle's calendar date. */
export const puzzleDate = (n: number) => new Date(LAUNCH_UTC + (n - 1) * DAY_MS);

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export const longDate = (d: Date) => d.toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" });

/**
 * The newest puzzle that has ended in every time zone. Day D is still being played in UTC-12 until noon UTC on D+1,
 * so a puzzle is only published after that, and no page ever spoils a game someone could still be playing.
 */
export function lastFinishedPuzzle(now: Date): number {
  return Math.floor((now.getTime() - LAUNCH_UTC - DAY_MS - 12 * 3_600_000) / DAY_MS) + 1;
}

export interface DayAnswers {
  n: number;
  date: Date;
  classic: College;
  hard: College;
}

export function answersFor(n: number, data: ArchiveData): DayAnswers {
  return {
    n,
    date: puzzleDate(n),
    classic: data.byId.get(scheduledAnswer(n, data.classic, "classic"))!,
    hard: data.byId.get(scheduledAnswer(n, data.hard, "hard"))!,
  };
}

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/** Share (0-100) of the values that pass the test. */
function share(values: number[], test: (x: number) => boolean): number {
  return Math.round((values.filter(test).length / values.length) * 100);
}

const known = (xs: (number | null)[]) => xs.filter((x): x is number => x !== null);

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

function kind(name: string): string {
  if (/universit/i.test(name)) return "university";
  if (/institute/i.test(name)) return "institute";
  if (/academy/i.test(name)) return "academy";
  return "college";
}

const dollars = (n: number) => `$${formatInt(n)}`;

const article = (word: string) => (/^[aeiou]/i.test(word) ? "an" : "a");

/** The fact rows shown on an archive page, in the same order as the game's clues. */
export function factRows(c: College, conference: string | null): [string, string][] {
  const rows: [string, string][] = [["Location", `${c.city}, ${STATE_NAMES[c.state] ?? c.state}`]];
  if (c.undergrads !== null) rows.push(["Undergraduates", formatInt(c.undergrads)]);
  if (c.acceptance !== null) rows.push(["Acceptance rate", percent(c.acceptance)]);
  if (c.tuition !== null) rows.push([c.control === "public" ? "In-state tuition" : "Tuition", c.tuition === 0 ? "$0" : `$${formatInt(c.tuition)}`]);
  if (c.founded !== null) rows.push(["Founded", String(c.founded)]);
  if (conference) rows.push(["Conference", conference]);
  if (c.mascot) rows.push(["Mascot", c.mascot]);
  if (c.control) rows.push(["Type", c.control === "public" ? "Public" : "Private nonprofit"]);
  return rows;
}

/**
 * A few short paragraphs about a school, built only from the data: how it compares with the other schools in the
 * game, and how much each clue narrows things down. Phrasing varies with the seed so pages don't read alike.
 */
export function describe(c: College, data: ArchiveData, seed: string): string[] {
  const pick = <T,>(options: T[], salt: string) => options[(hashString(`${seed}:${salt}`) >>> 0) % options.length];
  const all = data.colleges;
  const total = all.length;
  const state = STATE_NAMES[c.state] ?? c.state;
  const conference = data.conferenceOf(c.id);
  const control = c.control === "public" ? "public" : c.control === "private" ? "private" : "";
  const out: string[] = [];

  // Who and where, plus age.
  const intro = [`${c.name} is ${article(control || kind(c.name))} ${[control, kind(c.name)].filter(Boolean).join(" ")} in ${c.city}, ${state}.`];
  if (c.founded !== null) {
    const years = known(all.map((x) => x.founded));
    const older = share(years, (y) => y > c.founded!);
    const p = share(years, (y) => y < c.founded!);
    intro.push(
      older >= 50
        ? pick(
            [
              `Founded in ${c.founded}, it is older than ${older}% of the ${formatInt(total)} schools in Campusle.`,
              `It dates to ${c.founded}, which puts it ahead of ${older}% of the schools in the game.`,
            ],
            "age",
          )
        : pick(
            [`It was founded in ${c.founded}, younger than ${p}% of the schools in Campusle.`, `It opened in ${c.founded}, so ${p}% of the schools in the game are older.`],
            "age",
          ),
    );
  }
  if (conference && !NOT_A_LEAGUE.has(conference) && c.founded !== null) {
    const members = all.filter((x) => data.conferenceOf(x.id) === conference && x.founded !== null).sort((a, b) => a.founded! - b.founded!);
    const rank = members.findIndex((x) => x.id === c.id) + 1;
    if (members.length >= 4 && rank > 0) {
      intro.push(
        rank === 1
          ? `That makes it the oldest of the ${members.length} ${conference} schools in the game.`
          : rank === members.length
            ? `That makes it the youngest of the ${members.length} ${conference} schools in the game.`
            : `Among the ${members.length} ${conference} schools in the game, it is the ${ordinal(rank)} oldest.`,
      );
    }
  }
  out.push(intro.join(" "));

  // Size, selectivity and cost.
  const size: string[] = [];
  if (c.undergrads !== null) {
    const sizes = known(all.map((x) => x.undergrads));
    const p = share(sizes, (n) => n < c.undergrads!);
    size.push(
      p >= 50
        ? `With about ${formatInt(c.undergrads)} undergraduates, it is bigger than ${p}% of the schools in Campusle.`
        : `With about ${formatInt(c.undergrads)} undergraduates, it is smaller than ${share(sizes, (n) => n > c.undergrads!)}% of the schools in Campusle.`,
    );
  }
  if (c.acceptance !== null) {
    if (c.acceptance >= 0.98) {
      size.push(`It admits nearly everyone who applies (${percent(c.acceptance)}).`);
    } else {
      const moreSelective = share(known(all.map((x) => x.acceptance)), (a) => a > c.acceptance!);
      size.push(
        moreSelective >= 50
          ? `It admits ${percent(c.acceptance)} of applicants, making it more selective than ${moreSelective}% of the schools in the game.`
          : `It admits ${percent(c.acceptance)} of applicants, so most schools in the game are harder to get into.`,
      );
    }
  }
  if (c.tuition !== null && c.control) {
    const peers = known(all.filter((x) => x.control === c.control).map((x) => x.tuition));
    const m = median(peers);
    const label = c.control === "public" ? "In-state tuition" : "Tuition";
    if (c.tuition === 0) size.push(`Students pay no tuition.`);
    else if (Math.abs(c.tuition - m) / m < 0.1) size.push(`${label} is ${dollars(c.tuition)} a year, close to the typical ${c.control} school in the game (${dollars(m)}).`);
    else size.push(`${label} is ${dollars(c.tuition)} a year, ${c.tuition > m ? "above" : "below"} the typical ${c.control} school in the game (${dollars(m)}).`);
  }
  if (size.length) out.push(size.join(" "));

  // Geography and how the clues narrow it down.
  const others = all.filter((x) => x.id !== c.id);
  const nearest = others.reduce((best, x) => (distanceMiles(c, x) < distanceMiles(c, best) ? x : best), others[0]);
  const gap = distanceMiles(c, nearest);
  const away = gap < 2 ? "less than two miles away" : `about ${formatInt(gap)} miles away`;
  const within50 = others.filter((x) => distanceMiles(c, x) <= 50).length;
  const sameState = others.filter((x) => x.state === c.state).length;
  const geo = [
    pick(
      [
        `The nearest other school in Campusle is ${nearest.name}, ${away}`,
        `Its closest neighbor in the game is ${nearest.name}, ${away}`,
      ],
      "near",
    ) + (within50 > 1 ? `, and ${within50} schools in the game are within 50 miles.` : "."),
  ];
  if (sameState === 0) geo.push(`It is the only school in the game in ${state}, so a green location tile gives it away.`);
  else geo.push(`Even with a green location tile (same state), there are ${sameState + 1} ${state} schools in the game to choose from.`);
  if (conference && !NOT_A_LEAGUE.has(conference)) {
    const confMates = others.filter((x) => data.conferenceOf(x.id) === conference);
    const both = confMates.filter((x) => x.state === c.state).length;
    geo.push(
      both === 0
        ? `Combined with the ${conference} clue, the state pins it down to a single school.`
        : `The ${conference} clue alone narrows it to ${confMates.length + 1} schools; combined with the state, ${both + 1}.`,
    );
  }
  if (c.mascot) geo.push(pick([`Its teams are the ${c.mascot}.`, `Its athletic teams go by the ${c.mascot}.`], "mascot"));
  out.push(geo.join(" "));
  return out;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const STYLE = `
      :root { color-scheme: light dark; --bg: #fff8ee; --ink: #1d2433; --muted: #5d6480; --accent: #e2553d; --card: #ffffff; --line: #eadfce; }
      @media (prefers-color-scheme: dark) { :root { --bg: #14131a; --ink: #f1eee6; --muted: #a9a6b8; --accent: #ff7a5c; --card: #1d1c25; --line: #34323f; } }
      body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
      main { max-width: 680px; margin: 0 auto; padding: 32px 16px 64px; }
      h1 { font-size: 30px; line-height: 1.2; margin: 0 0 4px; }
      h2 { font-size: 21px; margin: 32px 0 8px; }
      .muted { color: var(--muted); font-size: 14px; }
      a { color: var(--accent); }
      nav { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 15px; margin-bottom: 20px; }
      .spoiler { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; font-size: 14px; }
      table { width: 100%; border-collapse: collapse; background: var(--card); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; font-size: 15px; }
      th, td { text-align: left; padding: 7px 12px; border-top: 1px solid var(--line); vertical-align: top; }
      tr:first-child th, tr:first-child td { border-top: 0; }
      th { width: 42%; font-weight: 600; color: var(--muted); }
      .play { display: inline-block; margin-top: 28px; background: var(--accent); color: #fff; text-decoration: none; font-weight: 700; padding: 10px 18px; border-radius: 999px; }
      .pager { display: flex; justify-content: space-between; gap: 12px; margin-top: 28px; font-size: 15px; }
      ul.days { list-style: none; padding: 0; margin: 16px 0 0; }
      ul.days li { border-top: 1px solid var(--line); padding: 10px 0; }
      footer { margin-top: 40px; font-size: 13px; color: var(--muted); }`;

function page(opts: { title: string; description: string; path: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(opts.title)}</title>
    <meta name="description" content="${esc(opts.description)}" />
    <link rel="canonical" href="${SITE}${opts.path}" />
    <meta property="og:title" content="${esc(opts.title)}" />
    <meta property="og:description" content="${esc(opts.description)}" />
    <meta property="og:url" content="${SITE}${opts.path}" />
    <meta property="og:image" content="${SITE}/logo.png" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1186123049294297" crossorigin="anonymous"></script>
    <style>${STYLE}
    </style>
  </head>
  <body>
    <main>
      <nav><a href="/">← Play today's Campusle</a><a href="/archive/">All past puzzles</a></nav>
${opts.body}
      <footer>
        School data: U.S. Department of Education College Scorecard and Wikidata, with conferences and mascots checked by hand.
        <br /><a href="/how-to-play.html">How to play</a> · <a href="/about.html">About</a> · <a href="/privacy.html">Privacy</a>
      </footer>
    </main>
  </body>
</html>
`;
}

function schoolSection(label: string, c: College, data: ArchiveData, seed: string): string {
  const rows = factRows(c, data.conferenceOf(c.id))
    .map(([k, v]) => `          <tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
    .join("\n");
  const paras = describe(c, data, seed)
    .map((p) => `      <p>${esc(p)}</p>`)
    .join("\n");
  return `
      <h2>${label}: ${esc(c.name)}</h2>
      <table>
        <tbody>
${rows}
        </tbody>
      </table>
${paras}`;
}

export function dayPage(day: DayAnswers, last: number, data: ArchiveData): string {
  const date = longDate(day.date);
  const prev = day.n > 1 ? `<a href="/archive/${day.n - 1}.html">← #${day.n - 1}</a>` : "<span></span>";
  const next = day.n < last ? `<a href="/archive/${day.n + 1}.html">#${day.n + 1} →</a>` : "<span></span>";
  return page({
    title: `Campusle #${day.n} answer (${date}): ${day.classic.name}`,
    description: `The answers to Campusle #${day.n} from ${date}: ${day.classic.name} (Classic) and ${day.hard.name} (Hard), with each school's location, size, acceptance rate, tuition and founding year.`,
    path: `/archive/${day.n}.html`,
    body: `
      <h1>Campusle #${day.n} answers</h1>
      <p class="muted">${date}</p>
      <p class="spoiler">Spoiler: this page shows the answers to puzzle #${day.n}. Today's puzzle is never posted here until it has ended everywhere.</p>
${schoolSection("Classic", day.classic, data, `${day.n}:classic`)}
${schoolSection("Hard", day.hard, data, `${day.n}:hard`)}
      <a class="play" href="/">Play today's puzzle →</a>
      <div class="pager">${prev}<a href="/archive/">All puzzles</a>${next}</div>`,
  });
}

export function indexPage(days: DayAnswers[], schools: number): string {
  const items = [...days]
    .reverse()
    .map(
      (d) =>
        `        <li><a href="/archive/${d.n}.html"><b>#${d.n}</b> · ${longDate(d.date)}</a><br /><span class="muted">Classic: ${esc(d.classic.name)} · Hard: ${esc(d.hard.name)}</span></li>`,
    )
    .join("\n");
  return page({
    title: "Campusle archive: every past answer",
    description: "Every past Campusle puzzle with its Classic and Hard answers, plus facts about each school: location, enrollment, acceptance rate, tuition and founding year.",
    path: "/archive/",
    body: `
      <h1>Campusle archive</h1>
      <p class="muted">Every past puzzle, newest first</p>
      <p>Missed a day, or want to know more about a school that stumped you? Each page below has the Classic and Hard answers for one day, the facts behind every clue, and how that school compares with the ${formatInt(Math.floor(schools / 100) * 100)}+ colleges in the game. A new page is added each morning, once the previous day's puzzle has ended in every time zone.</p>
      <ul class="days">
${items}
      </ul>
      <a class="play" href="/">Play today's puzzle →</a>`,
  });
}

export function sitemap(days: DayAnswers[]): string {
  const latest = days.length ? isoDate(new Date(days.at(-1)!.date.getTime() + DAY_MS)) : undefined;
  const url = (path: string, freq: string, lastmod?: string) =>
    `  <url><loc>${SITE}${path}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>${freq}</changefreq></url>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[
  url("/", "daily"),
  url("/archive/", "daily", latest),
  url("/how-to-play.html", "monthly"),
  url("/about.html", "monthly"),
  url("/privacy.html", "yearly"),
  ...days.map((d) => url(`/archive/${d.n}.html`, "yearly", isoDate(new Date(d.date.getTime() + DAY_MS)))),
].join("\n")}
</urlset>
`;
}
