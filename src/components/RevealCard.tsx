import { MODE_CONFIG, type Entity, type Mode, type Scene } from "../lib/modes";
import type { Status } from "../useGame";
import { Countdown } from "./Countdown";
import { ShareIcon } from "./icons";
import { TradingCard } from "./TradingCard";

interface Props {
  mode: Mode;
  puzzle: number;
  answer: Entity;
  status: Status;
  guessCount: number;
  otherMode: { mode: Mode; done: boolean };
  onShare: () => void;
  onStats: () => void;
  onSwitchMode: (m: Mode) => void;
}

/** The lecture hall grades you like a report card, the stadium calls the play, the card shop grades your pull. Index = guesses - 1. */
const HEADLINES: Record<Scene, { win: string[]; lose: string; kicker: (n: number) => string; loseKicker: string }> = {
  classic: {
    win: ["A+ 🤯", "A 🧠", "B+ 🔥", "B 🙌", "C+ 🎉", "Passed! 😅"],
    lose: "Better luck tomorrow.",
    kicker: (n) => `Report card · solved in ${n}/6`,
    loseKicker: "Grade: incomplete",
  },
  gridiron: {
    win: ["PICK SIX! 🤯", "TOUCHDOWN! 🏈", "TOUCHDOWN! 🔥", "TOUCHDOWN! 🙌", "FIELD GOAL! 🎉", "SAFETY! 😅"],
    lose: "Better luck tomorrow.",
    kicker: (n) => `Scored on down ${n} of 6`,
    loseKicker: "Turnover on downs",
  },
  cards: {
    win: ["GEM MINT 10 💎", "MINT 9 🔥", "NM-MT 8 ⭐", "NEAR MINT 7 🙌", "EX-MT 6 🎉", "EXCELLENT 5 😅"],
    lose: "Better luck tomorrow.",
    kicker: (n) => `Pulled on card ${n} of 6`,
    loseKicker: "This one got away",
  },
};

/** The school reveal shown after the game ends (inside the result popup). */
export function RevealCard({ mode, puzzle, answer, status, guessCount, otherMode, onShare, onStats, onSwitchMode }: Props) {
  const cfg = MODE_CONFIG[mode];
  const h = HEADLINES[cfg.scene];
  const stripe = cfg.colors(answer) ?? ["var(--color-accent)", "var(--color-gold)"];
  const other = MODE_CONFIG[otherMode.mode];

  return (
    <div>
      <p className="text-center text-[12px] font-black uppercase tracking-[0.16em] text-muted">{status === "won" ? h.kicker(guessCount) : h.loseKicker}</p>
      <h2 className="title mt-1 text-center text-[28px] leading-tight sm:text-[32px]">{status === "won" ? h.win[guessCount - 1] : h.lose}</h2>

      {cfg.scene === "cards" && (
        <div className="mt-4">
          <div className="grade-label flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
            <span>Campusle #{puzzle}</span>
            <span className="card-font text-[14px] tracking-[0.06em]">{status === "won" ? h.win[guessCount - 1].replace(/\s*\S+$/u, "") : "UNGRADED"}</span>
          </div>
          <TradingCard playerId={answer.id} serial={`#${String(puzzle).padStart(3, "0")}`} />
        </div>
      )}

      <div className="panel mt-4 overflow-hidden">
        {cfg.scene !== "cards" && (
          <div className="flex h-3">
            {stripe.map((c, i) => (
              <div key={i} className="flex-1" style={{ background: c }} />
            ))}
          </div>
        )}
        <div className="px-4 pt-3 pb-4">
          {cfg.scene === "cards" ? (
            // The trading card above already shows the name, so this panel is just the back of the card.
            <div className="text-[11px] font-black uppercase tracking-wider text-muted">Back of the card</div>
          ) : (
            <>
              <div className="text-[11px] font-black uppercase tracking-wider text-muted">Today's {cfg.noun}</div>
              <div className="mt-0.5 text-[24px] font-black leading-tight">{answer.short}</div>
              {answer.short !== answer.name && <div className="text-[13px] font-semibold text-muted">{answer.name}</div>}
              <div className="mt-2 flex flex-wrap gap-1.5 text-[13px] font-bold">
                {cfg.chips(answer).map((chip) => (
                  <span key={chip} className="rounded-full bg-sunken px-2.5 py-1">
                    {chip}
                  </span>
                ))}
              </div>
            </>
          )}
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
        <button onClick={onShare} className="btn btn-primary flex flex-1 items-center justify-center gap-2 py-3.5 text-[18px]">
          Share <ShareIcon className="h-5 w-5" />
        </button>
        <button onClick={onStats} className="btn btn-secondary px-5 text-[16px]">
          Stats
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-sunken px-4 py-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-wider text-muted">Next {cfg.name} in</div>
          <Countdown className="text-[22px]" />
        </div>
        {!otherMode.done && (
          <button onClick={() => onSwitchMode(otherMode.mode)} className="btn btn-secondary px-3 py-2 text-[14px]">
            Play {other.emoji} {other.name}
          </button>
        )}
      </div>
    </div>
  );
}
