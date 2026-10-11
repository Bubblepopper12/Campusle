// localStorage can throw (Safari private mode, blocked cookies, quota). Every access goes through here,
// and the game keeps working in memory when storage is unavailable.

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked or full: ignore.
  }
}

export const KEYS = {
  game: (mode: string) => `campusle:v1:game:${mode}`,
  stats: (mode: string) => `campusle:v1:stats:${mode}`,
  seenHelp: "campusle:v1:seen-help",
  mode: "campusle:v1:mode",
};
