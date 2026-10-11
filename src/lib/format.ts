const int = new Intl.NumberFormat("en-US");

export const formatInt = (n: number) => int.format(Math.round(n));

/** 41300 → "41.3K", 950 → "950". */
export function compact(n: number): string {
  if (n >= 100_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(Math.round(n));
}

export function money(n: number): string {
  if (n === 0) return "$0";
  return `$${compact(n)}`;
}

export function percent(rate: number): string {
  const p = rate * 100;
  if (p > 0 && p < 1) return "<1%";
  return p < 10 ? `${p.toFixed(1).replace(/\.0$/, "")}%` : `${Math.round(p)}%`;
}

export function miles(n: number): string {
  return n < 10 ? `${n.toFixed(1).replace(/\.0$/, "")}` : formatInt(n);
}

/** Short tile labels for conference names that don't fit in a tile. */
const TILE_CONF: Record<string, string> = {
  "Mountain West": "MWC",
  American: "AAC",
  "Ivy League": "Ivy",
  "Division III": "D-III",
  "Division II": "D-II",
  "America East": "Am. East",
  Independent: "Indep.",
  Southland: "S'land",
  "Big South": "Big South",
};
export const tileConference = (c: string) => TILE_CONF[c] ?? c;
