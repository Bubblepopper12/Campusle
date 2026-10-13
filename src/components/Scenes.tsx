import type { ReactNode } from "react";
import { MODES, MODE_CONFIG, type Mode } from "../lib/modes";
import { MAX_GUESSES } from "../lib/stats";
import { ChartIcon, HelpIcon } from "./icons";

export interface FrameProps {
  mode: Mode;
  done: Record<Mode, boolean>;
  onChangeMode: (m: Mode) => void;
  onHelp: () => void;
  onStats: () => void;
  puzzle: number;
  guessCount: number;
  finished: boolean;
  children: ReactNode;
}

const shortDate = () => new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="icon-btn btn grid h-11 w-11 shrink-0 place-items-center">
      {children}
    </button>
  );
}

function ModeTabs({ mode, done, onChange, className }: { mode: Mode; done: Record<Mode, boolean>; onChange: (m: Mode) => void; className: string }) {
  return (
    <div role="tablist" aria-label="Game mode" className={className}>
      {MODES.map((m) => {
        const cfg = MODE_CONFIG[m];
        return (
          <button key={m} role="tab" aria-selected={m === mode} onClick={() => onChange(m)} className="tab flex items-center justify-center gap-1.5 px-3 py-1.5">
            <span aria-hidden>{cfg.emoji}</span>
            {cfg.name}
            {done[m] && (
              <span className="text-[0.8em]" aria-label="(done today)">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────── Classic: chalkboard in a lecture hall ─────────────── */

const PENNANTS = ["#b3202a", "#1f4e9c", "#f2a900", "#1d6b3a", "#5b2a86", "#e0661b", "#0f6b68", "#7d1734", "#1f2f6b", "#c8102e", "#2e7d32", "#f0b400"];

/** A string of college-style pennants hung across the top of the wall. */
export function Pennants() {
  return (
    <svg className="pointer-events-none absolute inset-x-0 top-0 h-[58px] w-full" viewBox="0 0 720 58" preserveAspectRatio="xMidYMin slice" aria-hidden>
      <path d="M-10 6 Q 360 26 730 6" fill="none" stroke="#2b1a0e" strokeWidth="2" />
      {PENNANTS.map((color, i) => {
        const x = 8 + i * 60;
        const sag = 6 + Math.sin((Math.PI * (x + 10)) / 740) * 18;
        const rot = (i % 2 ? 3 : -3) + (i % 3) - 1;
        return (
          <g key={i} transform={`translate(${x} ${sag}) rotate(${rot} 22 0)`}>
            <path d="M0 0 H44 L22 46 Z" fill={color} stroke="rgb(0 0 0 / 0.35)" strokeWidth="1" />
            <path d="M3 7 H41 L39.3 11 H4.7 Z" fill="rgb(255 255 255 / 0.85)" />
            <circle cx="22" cy="21" r="4.5" fill="rgb(255 255 255 / 0.8)" />
          </g>
        );
      })}
    </svg>
  );
}

export function ClassicFrame({ mode, done, onChangeMode, onHelp, onStats, puzzle, children }: FrameProps) {
  const cfg = MODE_CONFIG[mode];
  return (
    <>
      <div className="chalkboard px-3 pt-3 pb-4">
        <header className="flex items-center justify-between gap-2">
          <IconButton label="How to play" onClick={onHelp}>
            <HelpIcon className="h-5 w-5" />
          </IconButton>
          <div className="text-center">
            <h1 className="chalk-logo text-[40px] leading-none sm:text-[46px]">Campusle</h1>
            <svg viewBox="0 0 200 12" className="mx-auto -mt-0.5 h-2.5 w-36" aria-hidden>
              <path d="M4 8 C 40 2, 70 11, 104 6 S 170 3, 196 7" fill="none" stroke="#f7df72" strokeWidth="3.2" strokeLinecap="round" opacity="0.9" />
            </svg>
          </div>
          <IconButton label="Statistics" onClick={onStats}>
            <ChartIcon className="h-5 w-5" />
          </IconButton>
        </header>

        <ModeTabs mode={mode} done={done} onChange={onChangeMode} className="mt-2 flex justify-center gap-5" />

        <div className="chalk mt-2 mb-3 flex items-baseline justify-between gap-2 px-1 font-[family-name:var(--font-hand)] text-[15px] whitespace-nowrap">
          <span>
            <span className="font-bold text-[#f7df72]">No. {puzzle}</span> <span className="opacity-75">· {shortDate()}</span>
          </span>
          <span className="truncate opacity-75">{cfg.tagline}</span>
        </div>

        {children}
      </div>
      <ChalkTray />
    </>
  );
}

function ChalkTray() {
  return (
    <div className="chalk-tray" aria-hidden>
      <span className="absolute -top-[5px] left-[18%] h-[7px] w-9 rotate-[-3deg] rounded-full bg-[#f5f2e8] shadow" />
      <span className="absolute -top-[5px] left-[34%] h-[7px] w-6 rotate-[4deg] rounded-full bg-[#f7df72] shadow" />
      <span className="absolute -top-[5px] left-[42%] h-[7px] w-7 rounded-full bg-[#f2a7b8] shadow" />
      <span className="absolute -top-[9px] right-[16%] flex h-[13px] w-16 flex-col overflow-hidden rounded-[3px] shadow-md">
        <span className="h-[8px] bg-[#c99a62]" />
        <span className="flex-1 bg-[#3a3a40]" />
      </span>
    </div>
  );
}

/* ─────────────── Gridiron: jumbotron + football field ─────────────── */

export function GridironFrame({ mode, done, onChangeMode, onHelp, onStats, puzzle, guessCount, finished, children }: FrameProps) {
  const down = finished ? "FINAL" : `${Math.min(guessCount + 1, MAX_GUESSES)}/${MAX_GUESSES}`;
  const date = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase();
  return (
    <>
      <div className="scoreboard p-2.5">
        <header className="flex items-center justify-between gap-2">
          <IconButton label="How to play" onClick={onHelp}>
            <HelpIcon className="h-5 w-5" />
          </IconButton>
          <h1 className="led flicker text-[27px] leading-none font-bold sm:text-[32px]">CAMPUSLE</h1>
          <IconButton label="Statistics" onClick={onStats}>
            <ChartIcon className="h-5 w-5" />
          </IconButton>
        </header>
        <ModeTabs mode={mode} done={done} onChange={onChangeMode} className="mt-2.5 grid grid-cols-2 gap-1.5" />
        <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
          <ScoreCell label="GAME" value={String(puzzle).padStart(3, "0")} />
          <ScoreCell label="DOWN" value={down} />
          <ScoreCell label="DATE" value={date} />
        </div>
      </div>

      {/* Goal posts between the scoreboard and the field */}
      <svg viewBox="0 0 120 34" className="mx-auto -mb-1 block h-8 w-28" aria-hidden>
        <path d="M60 34 V18 M22 18 H98 M22 18 V0 M98 18 V0" fill="none" stroke="#ffd23f" strokeWidth="5" strokeLinecap="round" />
      </svg>

      <div className="field">
        <div className="endzone">
          <span className="endzone-text text-[30px] leading-none">GRIDIRON</span>
        </div>
        <div className="px-[14px] pt-3 pb-4">{children}</div>
        <div className="endzone endzone-bottom">
          <span className="endzone-text text-[19px] leading-none">CAMPUSLE</span>
        </div>
      </div>
    </>
  );
}

function ScoreCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="led-cell py-1.5">
      <div className="led-white text-[9px] leading-none opacity-80">{label}</div>
      <div className="led mt-1 text-[17px] leading-none font-bold">{value}</div>
    </div>
  );
}

export function Toast({ message }: { message: string }) {
  return (
    <div role="status" className="paper toast toast-in fixed top-[max(1rem,env(safe-area-inset-top))] left-1/2 z-[70] px-5 py-2.5 text-[15px] font-extrabold whitespace-nowrap">
      {message}
    </div>
  );
}
