import type { TileResult } from "./feedback";

export const SITE = "campusle.com";

/** One emoji per tile. Never includes school names. */
export function tileEmoji(t: TileResult): string {
  switch (t.color) {
    case "green":
      return "🟩";
    case "yellow":
      return "🟨";
    case "orange":
      return "🟧";
    case "red":
      return "🟥";
    case "gray":
      return t.dir === "up" ? "⬆️" : t.dir === "down" ? "⬇️" : "⬜";
    default:
      return "⬜";
  }
}

export function shareText(opts: { title: string; badge: string; puzzle: number; rows: TileResult[][]; won: boolean; maxGuesses: number }): string {
  const score = opts.won ? `${opts.rows.length}/${opts.maxGuesses}` : `X/${opts.maxGuesses}`;
  const grid = opts.rows.map((r) => r.map(tileEmoji).join("")).join("\n");
  return `${opts.title} #${opts.puzzle} ${opts.badge} ${score}\n${grid}\n${SITE}`;
}

export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

const prefersShareSheet = () =>
  typeof navigator.share === "function" && typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;

/** Native share sheet on phones, clipboard everywhere else. */
export async function shareResult(text: string): Promise<ShareOutcome> {
  if (prefersShareSheet()) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      // Fall through to the clipboard.
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return legacyCopy(text) ? "copied" : "failed";
  }
}

function legacyCopy(text: string): boolean {
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    return ok;
  } catch {
    return false;
  }
}
