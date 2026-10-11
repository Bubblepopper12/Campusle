import type { College } from "../lib/types";
import { TEAM_BY_ID } from "../lib/data";
import { MODE_CONFIG, type Mode } from "../lib/modes";
import type { Status } from "../useGame";
import { Countdown } from "./Countdown";
import { ShareIcon } from "./icons";

interface Props {
  mode: Mode;
  answer: College;
  status: Status;
  guessCount: number;
  otherMode: { mode: Mode; done: boolean };
  onShare: () => void;
  onStats: () => void;
  onSwitchMode: (m: Mode) => void;
}

const WIN_LINES = ["Genius! 🤯", "Brilliant! 🧠", "Impressive! 🔥", "Nice work! 🙌", "Got it! 🎉", "Phew! 😅"];

/** The school reveal shown after the game ends (inside the result modal). */
export function RevealCard({ mode, answer, status, guessCount, otherMode, onShare, onStats, onSwitchMode }: Props) {
  const cfg = MODE_CONFIG[mode];
  const team = TEAM_BY_ID.get(answer.id);
  const stripe = mode === "gridiron" && team?.colors.length ? team.colors.map((c) => c.hex) : ["var(--color-accent)", "var(--color-gold)"];
  const other = MODE_CONFIG[otherMode.mode];

  return (
    <div>
      <p className="text-center text-[13px] font-black uppercase tracking-[0.18em] text-muted">
        {status === "won" ? `Solved in ${guessCount}/6` : "Out of guesses"}
      </p>
      <h2 className="varsity mt-1 text-center text-[30px] leading-tight">{status === "won" ? WIN_LINES[guessCount - 1] : "Better luck tomorrow."}</h2>

      <div className="chunky mt-4 overflow-hidden rounded-2xl bg-surface">
        <div className="flex h-3">
          {stripe.map((c, i) => (
            <div key={i} className="flex-1" style={{ background: c }} />
          ))}
        </div>
        <div className="px-4 pt-3 pb-4">
          <div className="text-[11px] font-black uppercase tracking-wider text-muted">Today's {mode === "gridiron" ? "program" : "school"}</div>
          <div className="mt-0.5 text-[24px] font-black leading-tight">{answer.short}</div>
          {answer.short !== answer.name && <div className="text-[13px] font-semibold text-muted">{answer.name}</div>}
          <div className="mt-2 flex flex-wrap gap-1.5 text-[13px] font-bold">
            <span className="rounded-full bg-sunken px-2.5 py-1">📍 {answer.city}, {answer.state}</span>
            {answer.mascot && <span className="rounded-full bg-sunken px-2.5 py-1">🐾 {answer.mascot}</span>}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
            {cfg.facts(answer).map((f) => (
              <div key={f.label} className={`min-w-0 ${f.wide ? "col-span-2" : ""}`}>
                <dt className="text-[11px] font-black uppercase tracking-wider text-muted">{f.label}</dt>
                <dd className="truncate text-[15px] font-extrabold" title={f.value}>
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-4 flex gap-2.5">
        <button onClick={onShare} className="press chunky flex flex-1 items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-[18px] font-black text-accent-ink">
          Share <ShareIcon className="h-5 w-5" />
        </button>
        <button onClick={onStats} className="press chunky rounded-2xl bg-surface px-5 text-[16px] font-black">
          Stats
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-sunken px-4 py-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-wider text-muted">Next {cfg.name} in</div>
          <Countdown className="text-[22px]" />
        </div>
        {!otherMode.done && (
          <button onClick={() => onSwitchMode(otherMode.mode)} className="press chunky-sm rounded-xl bg-surface px-3 py-2 text-[14px] font-black">
            Play {other.emoji} {other.name}
          </button>
        )}
      </div>
    </div>
  );
}
