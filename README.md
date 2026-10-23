# Campusle 🎓

A free, Wordle-style daily college guessing game. Everyone gets the same mystery school each day and has 6 guesses to find it. Each guess shows a row of clue tiles, and you can share a spoiler-free emoji result.

There are four daily puzzles:

| Mode | Answers | Clues |
| --- | --- | --- |
| 🎓 **Classic** | ~220 well-known schools (`src/data/answers.txt`) | 📍 distance + direction · 👥 undergrads · 🎟️ acceptance rate · 💵 in-state tuition · 🏛️ founded · 🏆 athletic conference |
| 🧠 **Hard** (Classic's "Hard" level) | ~170 niche schools (`src/data/answers-hard.txt`) | Same as Classic |
| 🏈 **Football** | All 136 FBS programs (`scripts/data/football.tsv`) | 📍 distance + direction · 🏆 football conference · 🏟️ stadium capacity · 📜 first season · 🥇 national titles · 🎨 team colors |
| ⭐ **Players** | ~150 famous college football players, past and present (`scripts/data/players.tsv`) | 🏫 school · 🏈 position · 📅 final season · 🏆 Heisman · 💍 national titles · #️⃣ jersey number |

Each mode has its own scene: Classic and Hard are a lecture-hall chalkboard with sticky-note tiles; Football is a stadium with a jumbotron and a painted field (a night game in dark mode); Players is a trading-card collection: a holographic foil pack, guesses in graded-card slabs, and a pulled player card graded GEM MINT 10 to EXCELLENT 5 at the end. The scene is set by `<html data-mode>` and styled in `src/index.css`. Classic is the home screen; the ☰ menu (top-left) lists every game, how to play and stats. Every game is free for now; each menu entry in `MENU` (`src/lib/modes.ts`) has a `tier` field where a paywall could hook in later. Each mode has its own saved game, stats and streak. Links: `#hard`, `#football` (old `#gridiron` links still work) and `#players`.

Football mode's internal id is still `gridiron`, so saved games and streaks carry over from before the rename.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (logic, autocomplete, data integrity, data-script parsing)
npm run build      # typecheck + production build into dist/
```

## Deploy

It's a fully static Vite site with no backend, so it needs no configuration:

- **Vercel:** import the repo. Vercel detects Vite and builds `dist/`.
- **Netlify:** import the repo. `netlify.toml` already sets `npm run build` → `dist`.

## Rules

- **Location:** Haversine distance in miles from your guess to the answer, plus an arrow toward it (initial bearing, snapped to 8 directions). 🟩 same state · 🟨 under 250 mi · 🟧 under 750 mi · 🟥 farther.
- **Numbers:** 🟩 exact or within 5% · 🟨 within 25% · gray otherwise. Yellow and gray tiles show ⬆️/⬇️ for whether the answer is higher or lower.
  - Years (founded, first season) are measured against the answer's *age*, so 1880 vs 1885 is close but 1880 vs 1960 isn't.
  - National titles are small counts: exact is green, within 2 is yellow.
- **Conference:** green if it matches, gray if not. In Classic, schools outside Division I show `Division II`, `Division III`, `NAIA` or `None`.
- **Colors (Football):** green if the main color family matches, yellow if any color is shared (white doesn't count).

Share text uses one emoji per tile and never includes school names:

```
Campusle #14 🎓 4/6
🟥🟨⬇️⬆️⬜🟩
...
campusle.com
```

On phones, Share opens the native share sheet. Everywhere else it copies to the clipboard.

## Daily puzzle

- `LAUNCH_DATE` in `src/lib/daily.ts` is puzzle #1 (currently **Oct 11, 2026**). The puzzle number is the number of days since launch in the player's local time zone, so a new puzzle starts at local midnight.
- The answer list is sorted, then each pass through it is a seeded shuffle (mulberry32 + string hash). Every player gets the same school on the same date, and no school repeats until the whole list has been used. Each mode uses its own seed.
- ⚠️ **Adding or removing answer IDs reshuffles future puzzles.** Make list edits before launch, or rarely.

## Data

| File | What it is | Edit by hand? |
| --- | --- | --- |
| `src/data/colleges.json` | Every guessable school. Generated. | No, regenerate it |
| `src/data/football.json` | Football mode data. Generated from `scripts/data/football.tsv`. | No |
| `src/data/answers.txt` | Classic answer list, one ID per line, `#` comments | **Yes** |
| `src/data/aliases.json` | Short display names + autocomplete aliases ("UT", "A&M", "Penn"…) | **Yes** |
| `src/data/overrides.json` | Hand fixes, merged in last | **Yes** |
| `scripts/data/football.tsv` | Football conference, stadium, capacity, first season, titles, colors | **Yes** |
| `src/data/answers-hard.txt` | Hard answer list (niche schools), same format as answers.txt | **Yes** |
| `scripts/data/players.tsv` | Players: position, schools, final season, Heisman years, titles, jersey, active | **Yes** |
| `src/data/players.json` | Players data. Generated from players.tsv. | No |
| `scripts/data/colleges-offline.tsv` | Offline fallback stats (see below) | Only if you have no API access |

School IDs are slugs of the official College Scorecard name, e.g. `The University of Texas at Austin` → `university-of-texas-at-austin`.

### Building real data

```bash
cp .env.example .env            # add your free key from https://api.data.gov/signup/
npm run data:build              # downloads, merges, writes JSON, prints the report
npm run data:build -- --refresh # ignore the download cache in scripts/.cache/
npm run data:report             # re-print the report for the current JSON
```

`scripts/build-data.ts`:

1. **College Scorecard API.** Gets every operating, public or private nonprofit, predominantly bachelor's-granting school with 300+ undergrads in the 50 states + DC. Pulls location, undergraduate enrollment, in-state tuition, acceptance rate, public/private, and Scorecard's own aliases.
2. **Wikidata** (by IPEDS ID, property P1771). Pulls founding year (P571), athletic conference (P118 on the school or its athletics program), and team name/mascot.
3. Merges `aliases.json`, then `overrides.json` last.
4. Writes `colleges.json` and `football.json`, then prints (and saves to `data-report.txt`) every school with missing or suspicious values. Answer-list schools are starred and listed first. The report also lists answer IDs that aren't in the dataset, with suggestions.

To fix a value, add it to `overrides.json`:

```json
{
  "colleges": {
    "university-of-texas-at-austin": { "conference": "SEC", "mascot": "Texas Longhorns" },
    "some-school-id": { "exclude": true }
  },
  "football": {
    "northwestern-university": { "capacity": 35000 }
  }
}
```

An override for an unknown ID that includes `name`, `city`, `state`, `lat` and `lon` adds a new school.

### About the data in this commit

`colleges.json` is built by `npm run data:build` (College Scorecard + Wikidata, October 2026): about 1,500 four-year schools, plus the few answer-list schools the bachelor's-degree filter misses (`EXTRA_UNITIDS` in `scripts/build-data.ts`). Online-only campuses are left out.

- Conference and mascot come from `scripts/data/colleges-offline.tsv` first, because Wikidata rarely has them and often lists a pre-realignment conference. Schools outside that table fall back to Wikidata, which leaves most of them blank.
- If Scorecard renames a school, add the new id to `LEGACY_IDS` in `scripts/build-data.ts` so the old id (and the daily schedule) stays put. The report lists answer IDs that went missing.
- Founding years where Wikidata gives a merger or renaming date are pinned in `overrides.json`.
- The Scorecard host and `query.wikidata.org` must be reachable. In a proxied Node environment run the build with `NODE_USE_ENV_PROXY=1`.

Football and Players data have no free API source, so `football.tsv` and `players.tsv` are hand-curated. Current players were checked in October 2026. Recheck who's still playing, transfers and jersey numbers each season. After editing either file, run `npm run data:build` (or `data:offline`) to regenerate the JSON.

## Project layout

```
src/
  App.tsx, Game.tsx, useGame.ts   app shell, one mode's game, game state + saving
  components/                     tiles, board, autocomplete, modals, confetti
  lib/                            pure logic: daily.ts, feedback.ts, geo.ts, search.ts, share.ts, stats.ts, storage.ts
  data/                           JSON + editable lists
scripts/
  build-data.ts                   Scorecard + Wikidata build
  offline-data.ts                 fallback build from the TSV
  report-data.ts                  report only
  lib/                            shared pipeline, source parsing, conference names
tests/                            vitest
```

All `localStorage` access is wrapped in try/catch (`src/lib/storage.ts`). If storage is blocked, the game still works; it just won't remember progress.
