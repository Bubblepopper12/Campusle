import { MODES, MODE_CONFIG, type Mode } from "../lib/modes";
import { ChartIcon, HelpIcon } from "./icons";

export function Header({ onHelp, onStats }: { onHelp: () => void; onStats: () => void }) {
  return (
    <header className="flex items-center justify-between gap-2 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
      <IconButton label="How to play" onClick={onHelp}>
        <HelpIcon className="h-5 w-5" />
      </IconButton>
      <h1 className="flex items-center gap-1.5">
        <Pennant />
        <span className="varsity text-[31px] leading-none sm:text-[36px]">Campusle</span>
      </h1>
      <IconButton label="Statistics" onClick={onStats}>
        <ChartIcon className="h-5 w-5" />
      </IconButton>
    </header>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="press chunky-sm grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface text-ink">
      {children}
    </button>
  );
}

function Pennant() {
  return (
    <svg viewBox="0 0 40 30" className="h-7 w-9 -rotate-6" aria-hidden>
      <rect x="1" y="2" width="3.5" height="27" rx="1.5" fill="var(--color-ink)" />
      <path d="M4.5 3 L38 11.5 L4.5 20 Z" fill="var(--color-accent)" stroke="var(--color-ink)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 8.5 L20 11.5 L8 14.5 Z" fill="var(--color-gold)" />
    </svg>
  );
}

export function ModeTabs({ mode, done, onChange }: { mode: Mode; done: Record<Mode, boolean>; onChange: (m: Mode) => void }) {
  return (
    <div role="tablist" aria-label="Game mode" className="chunky-sm mx-auto mt-1 grid w-full max-w-[360px] grid-cols-2 gap-1 rounded-2xl bg-surface p-1">
      {MODES.map((m) => {
        const cfg = MODE_CONFIG[m];
        const active = m === mode;
        return (
          <button
            key={m}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m)}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-[15px] font-black transition-colors ${
              active ? "bg-ink text-bg" : "text-muted hover:text-ink"
            }`}
          >
            <span aria-hidden>{cfg.emoji}</span> {cfg.name}
            {done[m] && <span className={`text-[12px] ${active ? "text-gold" : "text-t-green"}`} aria-label="(done today)">✓</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Toast({ message }: { message: string }) {
  return (
    <div role="status" className="toast-in chunky-sm fixed top-[max(1rem,env(safe-area-inset-top))] left-1/2 z-[70] rounded-full bg-ink px-5 py-2.5 text-[15px] font-extrabold text-bg">
      {message}
    </div>
  );
}
