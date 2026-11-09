// Football conference membership over time for every school in the Players list, so the School clue compares the
// conference each player actually played in, not where their school is today (Oklahoma was Big 12, not SEC, for
// Baker Mayfield). Each entry is [first season, conference]; a school's list is in season order.
// Schools missing here fall back to their conference today. tests/modes.test.ts checks every player school is listed.

type Era = readonly [from: number, conference: string];

const SEC: Era[] = [[1933, "SEC"]];
const BIG_TEN: Era[] = [[1896, "Big Ten"]];
const ACC: Era[] = [[1953, "ACC"]];
/** The Pac-12's earlier names. */
const PAC = (from = 1959): Era[] => [
  [from, "AAWU"],
  [1968, "Pac-8"],
  [1978, "Pac-10"],
  [2011, "Pac-12"],
];

const HISTORY: Record<string, readonly Era[]> = {
  "university-of-alabama": SEC,
  "auburn-university": SEC,
  "university-of-florida": SEC,
  "university-of-georgia": SEC,
  "louisiana-state-university-and-agricultural-and-mechanical-college": SEC,
  "university-of-mississippi": SEC,
  "university-of-tennessee-knoxville": SEC,
  "vanderbilt-university": SEC,
  "university-of-arkansas": [[1915, "SWC"], [1992, "SEC"]],
  "university-of-south-carolina-columbia": [[1953, "ACC"], [1971, "Independent"], [1992, "SEC"]],
  "texas-a-and-m-university-college-station": [[1915, "SWC"], [1996, "Big 12"], [2012, "SEC"]],
  "university-of-texas-at-austin": [[1915, "SWC"], [1996, "Big 12"], [2024, "SEC"]],
  "university-of-oklahoma-norman-campus": [[1928, "Big Eight"], [1996, "Big 12"], [2024, "SEC"]],

  "ohio-state-university-main-campus": BIG_TEN,
  "university-of-michigan-ann-arbor": BIG_TEN,
  "university-of-wisconsin-madison": BIG_TEN,
  "university-of-illinois-urbana-champaign": BIG_TEN,
  "indiana-university-bloomington": BIG_TEN,
  "purdue-university-main-campus": BIG_TEN,
  "pennsylvania-state-university-main-campus": [[1887, "Independent"], [1993, "Big Ten"]],
  "university-of-nebraska-lincoln": [[1928, "Big Eight"], [1996, "Big 12"], [2011, "Big Ten"]],
  "university-of-southern-california": [...PAC(), [2024, "Big Ten"]],
  "university-of-california-los-angeles": [...PAC(), [2024, "Big Ten"]],
  "university-of-oregon": [...PAC(), [2024, "Big Ten"]],
  "university-of-washington-seattle-campus": [...PAC(), [2024, "Big Ten"]],

  "baylor-university": [[1914, "SWC"], [1996, "Big 12"]],
  "texas-tech-university": [[1960, "SWC"], [1996, "Big 12"]],
  "kansas-state-university": [[1913, "Big Eight"], [1996, "Big 12"]],
  "oklahoma-state-university-main-campus": [[1960, "Big Eight"], [1996, "Big 12"]],
  "university-of-colorado-boulder": [[1948, "Big Eight"], [1996, "Big 12"], [2011, "Pac-12"], [2024, "Big 12"]],
  "university-of-arizona": [[1962, "WAC"], [1978, "Pac-10"], [2011, "Pac-12"], [2024, "Big 12"]],
  "arizona-state-university-campus-immersion": [[1962, "WAC"], [1978, "Pac-10"], [2011, "Pac-12"], [2024, "Big 12"]],
  "brigham-young-university": [[1962, "WAC"], [1999, "Mountain West"], [2011, "Independent"], [2023, "Big 12"]],
  "university-of-cincinnati-main-campus": [[1996, "C-USA"], [2005, "Big East"], [2013, "American"], [2023, "Big 12"]],
  "university-of-central-florida": [[2005, "C-USA"], [2013, "American"], [2023, "Big 12"]],

  "clemson-university": ACC,
  "north-carolina-state-university-at-raleigh": ACC,
  "university-of-north-carolina-at-chapel-hill": ACC,
  "georgia-institute-of-technology-main-campus": [[1964, "Independent"], [1983, "ACC"]],
  "florida-state-university": [[1951, "Independent"], [1992, "ACC"]],
  "university-of-miami": [[1926, "Independent"], [1991, "Big East"], [2004, "ACC"]],
  "virginia-polytechnic-institute-and-state-university": [[1965, "Independent"], [1991, "Big East"], [2004, "ACC"]],
  "boston-college": [[1893, "Independent"], [1991, "Big East"], [2005, "ACC"]],
  "university-of-pittsburgh-pittsburgh-campus": [[1890, "Independent"], [1991, "Big East"], [2013, "ACC"]],
  "syracuse-university": [[1889, "Independent"], [1991, "Big East"], [2013, "ACC"]],
  "university-of-louisville": [[1996, "C-USA"], [2005, "Big East"], [2013, "American"], [2014, "ACC"]],
  "southern-methodist-university": [[1918, "SWC"], [1996, "WAC"], [2005, "C-USA"], [2013, "American"], [2024, "ACC"]],
  "stanford-university": [...PAC(), [2024, "ACC"]],
  "university-of-california-berkeley": [...PAC(), [2024, "ACC"]],

  "washington-state-university": [...PAC(1962), [2024, "Pac-12"]],
  "university-of-notre-dame": [[1887, "Independent"]],
  "united-states-naval-academy": [[1879, "Independent"], [2015, "American"]],
  "boise-state-university": [[2001, "WAC"], [2011, "Mountain West"]],
  "san-diego-state-university": [[1978, "WAC"], [1999, "Mountain West"]],
  "university-of-wyoming": [[1962, "WAC"], [1999, "Mountain West"]],
  "marshall-university": [[1997, "MAC"], [2005, "C-USA"], [2022, "Sun Belt"]],
  "new-mexico-state-university-main-campus": [[2023, "C-USA"]],
  "jackson-state-university": [[1958, "SWAC"]],
  "california-state-university-sacramento": [[1996, "Big Sky"]],
};

/** Names that are one conference under different names over the years. */
const SAME_LEAGUE: Record<string, string> = { AAWU: "Pac-12", "Pac-8": "Pac-12", "Pac-10": "Pac-12" };

export const hasConferenceHistory = (collegeId: string) => collegeId in HISTORY;

/** The school's football conference in a given season, or null when it isn't listed. */
export function conferenceIn(collegeId: string, season: number): string | null {
  const eras = HISTORY[collegeId];
  if (!eras) return null;
  let conf = eras[0][1];
  for (const [from, c] of eras) if (from <= season) conf = c;
  return conf;
}

/** Same conference, counting renamed ones as one. Independents aren't a conference, so two never match. */
export function sameConference(a: string | null, b: string | null): boolean {
  if (!a || !b || a === "Independent" || b === "Independent") return false;
  return (SAME_LEAGUE[a] ?? a) === (SAME_LEAGUE[b] ?? b);
}
