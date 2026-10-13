import { useMemo } from "react";
import { COLLEGE_BY_ID } from "../lib/data";
import { MID_MILES, NEAR_MILES } from "../lib/feedback";
import { MODE_CONFIG, type Mode } from "../lib/modes";
import { Modal } from "./Modal";
import { Tile } from "./Tile";

/** A fixed example pair per mode, evaluated live so the explanation always matches the real rules. */
const EXAMPLES: Record<Mode, { guess: string; answer: string }> = {
  classic: { guess: "michigan-state-university", answer: "university-of-iowa" },
  gridiron: { guess: "university-of-oregon", answer: "university-of-washington-seattle-campus" },
};

export function HowToPlay({ mode, onClose }: { mode: Mode; onClose: () => void }) {
  const cfg = MODE_CONFIG[mode];
  const example = useMemo(() => {
    const g = COLLEGE_BY_ID.get(EXAMPLES[mode].guess);
    const a = COLLEGE_BY_ID.get(EXAMPLES[mode].answer);
    if (!g || !a || !cfg.pool.some((c) => c.id === g.id) || !cfg.pool.some((c) => c.id === a.id)) return null;
    return { guess: g, tiles: cfg.evaluate(g, a) };
  }, [mode, cfg]);

  return (
    <Modal title="How to play" onClose={onClose}>
      <div className="space-y-4 text-[15px] leading-snug">
        <p>
          Find the mystery {mode === "gridiron" ? "college football program" : "college"} in <b>6 guesses</b>. Same school for everyone, new one
          every day at midnight.
        </p>
        <p className="rounded-xl bg-sunken px-3 py-2 text-[14px]">
          {mode === "classic" ? (<>🎓 <b>Classic</b> is any well-known U.S. college. Switch to 🏈 <b>Gridiron</b> for FBS football teams, with football clues.</>) : (<>🏈 <b>Gridiron</b> is FBS football teams only, with football clues. Switch to 🎓 <b>Classic</b> for every school.</>)}
        </p>

        {example && (
          <div>
            <div className="mb-1.5 flex items-baseline gap-2">
              <span className="text-[12px] font-black uppercase tracking-wider text-muted">Example guess</span>
              <span className="font-extrabold">{example.guess.short}</span>
            </div>
            <div className="tile-row grid grid-cols-6 gap-1.5">
              {example.tiles.map((t, i) => (
                <Tile key={i} tile={t} index={i} kind={cfg.columns[i].kind} animate />
              ))}
            </div>
            <ul className="mt-3 space-y-1.5 text-[14px]">
              {example.tiles.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-5 shrink-0 text-center">{cfg.columns[i].icon}</span>
                  <span>
                    <b>{cfg.columns[i].label}:</b> {t.aria.replace(/^[^:]+: /, "")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2 border-t-2 border-dashed border-line pt-3 text-[14px]">
          <Legend color="green">Same state, an exact match, or within 5%</Legend>
          <Legend color="yellow">Within 25%{mode === "gridiron" ? " (titles: within 2)" : ""}, or within {NEAR_MILES} miles</Legend>
          <Legend color="orange">Within {MID_MILES} miles</Legend>
          <Legend color="red">More than {MID_MILES} miles away</Legend>
          <Legend color="gray">Further off. The arrow shows if the answer is higher ⬆ or lower ⬇</Legend>
          <p className="text-[13px] text-muted">
            The 📍 arrow points from your guess toward the mystery school. Years count as close when they're within 5% / 25% of the
            answer's age.
          </p>
        </div>
      </div>
    </Modal>
  );
}

function Legend({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`tile tile-${color} h-5 w-5 shrink-0`} />
      <span>{children}</span>
    </div>
  );
}
