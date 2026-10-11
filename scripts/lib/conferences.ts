// Maps conference names as Wikidata labels them to the short names the game shows.
// Division I conferences keep their own name. Lower-division conferences collapse to
// "Division II" / "Division III" / "NAIA", per the game rules.

export const D1: Record<string, string> = {
  "southeastern conference": "SEC",
  "big ten conference": "Big Ten",
  "big 12 conference": "Big 12",
  "atlantic coast conference": "ACC",
  "pac-12 conference": "Pac-12",
  "mountain west conference": "Mountain West",
  "american athletic conference": "American",
  "american conference": "American",
  "sun belt conference": "Sun Belt",
  "conference usa": "C-USA",
  "mid-american conference": "MAC",
  "ivy league": "Ivy League",
  "big east conference": "Big East",
  "patriot league": "Patriot",
  "atlantic 10 conference": "A-10",
  "west coast conference": "WCC",
  "big west conference": "Big West",
  "big sky conference": "Big Sky",
  "summit league": "Summit",
  "the summit league": "Summit",
  "missouri valley conference": "MVC",
  "horizon league": "Horizon",
  "coastal athletic association": "CAA",
  "colonial athletic association": "CAA",
  "america east conference": "America East",
  "southern conference": "SoCon",
  "southwestern athletic conference": "SWAC",
  "mid-eastern athletic conference": "MEAC",
  "ohio valley conference": "OVC",
  "southland conference": "Southland",
  "western athletic conference": "WAC",
  "united athletic conference": "UAC",
  "asun conference": "ASUN",
  "atlantic sun conference": "ASUN",
  "big south conference": "Big South",
  "metro atlantic athletic conference": "MAAC",
  "northeast conference": "NEC",
};

/** Exact names the game uses. Anything else in the data is reported as suspicious. */
export const KNOWN_SHORT = new Set([
  ...Object.values(D1),
  "Independent",
  "Division II",
  "Division III",
  "NAIA",
  "None",
]);

const D2_HINTS = [
  "southern intercollegiate athletic conference",
  "central intercollegiate athletic association",
  "rocky mountain athletic conference",
  "great lakes intercollegiate athletic conference",
  "great lakes valley conference",
  "gulf south conference",
  "lone star conference",
  "pennsylvania state athletic conference",
  "south atlantic conference",
  "sunshine state conference",
  "peach belt conference",
  "conference carolinas",
  "great american conference",
  "great northwest athletic conference",
  "california collegiate athletic association",
  "mid-america intercollegiate athletics association",
  "northern sun intercollegiate conference",
  "northeast-10 conference",
  "mountain east conference",
  "east coast conference",
  "pacific west conference",
  "great midwest athletic conference",
  "gulf coast intercollegiate conference",
];

const D3_HINTS = [
  "new england small college athletic conference",
  "nescac",
  "university athletic association",
  "centennial conference",
  "new england women's and men's athletic conference",
  "southern california intercollegiate athletic conference",
  "liberty league",
  "minnesota intercollegiate athletic conference",
  "north coast athletic conference",
  "old dominion athletic conference",
  "midwest conference",
  "landmark conference",
  "state university of new york athletic conference",
  "college conference of illinois and wisconsin",
  "southern athletic association",
  "northwest conference",
  "american rivers conference",
  "iowa intercollegiate athletic conference",
  "empire 8",
  "middle atlantic conferences",
  "new jersey athletic conference",
  "little east conference",
  "massachusetts state collegiate athletic conference",
  "great northeast athletic conference",
  "commonwealth coast conference",
  "heartland collegiate athletic conference",
  "michigan intercollegiate athletic association",
  "ohio athletic conference",
  "presidents' athletic conference",
  "wisconsin intercollegiate athletic conference",
  "southern collegiate athletic conference",
  "american southwest conference",
  "upper midwest athletic conference",
  "northern athletics collegiate conference",
  "skyline conference",
  "capital athletic conference",
  "coast to coast athletic conference",
  "united east conference",
  "allegheny mountain collegiate conference",
  "colonial states athletic conference",
  "north eastern athletic conference",
  "atlantic east conference",
];

/** Returns the game's short conference name, or null when the label isn't recognized. */
export function normalizeConference(label: string | null | undefined): string | null {
  if (!label) return null;
  const key = label.trim().toLowerCase();
  if (D1[key]) return D1[key];
  if (D3_HINTS.some((h) => key.includes(h))) return "Division III";
  if (D2_HINTS.some((h) => key.includes(h))) return "Division II";
  if (key.includes("naia") || key.includes("national association of intercollegiate athletics")) return "NAIA";
  return null;
}
