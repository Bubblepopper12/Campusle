import { useCallback, useMemo, useState } from "react";
import { COLLEGE_BY_ID } from "./lib/data";
import { answerFor } from "./lib/daily";
import { MODE_CONFIG, type Mode } from "./lib/modes";
import { emptyStats, MAX_GUESSES, recordGame, type Stats } from "./lib/stats";
import { KEYS, load, save } from "./lib/storage";

interface SavedGame {
  puzzle: number;
  answerId: string;
  guesses: string[];
}

export type Status = "playing" | "won" | "lost";

export function loadStats(mode: Mode): Stats {
  const s = load<Partial<Stats>>(KEYS.stats(mode), {});
  return { ...emptyStats(), ...s };
}

/** True when today's game in this mode is already finished (for the ✓ on the mode tabs). */
export function isDone(mode: Mode, puzzle: number): boolean {
  const saved = load<SavedGame | null>(KEYS.game(mode), null);
  if (!saved || saved.puzzle !== puzzle) return false;
  return saved.guesses.includes(saved.answerId) || saved.guesses.length >= MAX_GUESSES;
}

export function useGame(mode: Mode, puzzle: number) {
  const cfg = MODE_CONFIG[mode];
  const answerId = useMemo(() => answerFor(puzzle, cfg.answers, mode), [puzzle, cfg, mode]);
  const answer = COLLEGE_BY_ID.get(answerId)!;
  const poolIds = useMemo(() => new Set(cfg.pool.map((c) => c.id)), [cfg]);

  const [guesses, setGuesses] = useState<string[]>(() => {
    const saved = load<SavedGame | null>(KEYS.game(mode), null);
    if (!saved || saved.puzzle !== puzzle || saved.answerId !== answerId || !Array.isArray(saved.guesses)) return [];
    return saved.guesses.filter((id) => poolIds.has(id)).slice(0, MAX_GUESSES);
  });
  const [stats, setStats] = useState<Stats>(() => loadStats(mode));

  const won = guesses.includes(answerId);
  const status: Status = won ? "won" : guesses.length >= MAX_GUESSES ? "lost" : "playing";

  const rows = useMemo(() => guesses.map((id) => cfg.evaluate(COLLEGE_BY_ID.get(id)!, answer)), [guesses, cfg, answer]);

  /** Returns the new status, or null if the guess wasn't accepted. */
  const submit = useCallback(
    (id: string): Status | null => {
      if (status !== "playing" || guesses.includes(id) || !poolIds.has(id)) return null;
      const next = [...guesses, id];
      setGuesses(next);
      save(KEYS.game(mode), { puzzle, answerId, guesses: next } satisfies SavedGame);
      const nextStatus: Status = id === answerId ? "won" : next.length >= MAX_GUESSES ? "lost" : "playing";
      if (nextStatus !== "playing") {
        const updated = recordGame(stats, puzzle, nextStatus === "won", next.length);
        setStats(updated);
        save(KEYS.stats(mode), updated);
      }
      return nextStatus;
    },
    [status, guesses, poolIds, mode, puzzle, answerId, stats],
  );

  return { cfg, answer, guesses, rows, status, stats, submit };
}
