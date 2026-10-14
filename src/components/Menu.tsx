import { useEffect, useRef } from "react";
import { MENU, MODE_CONFIG, type Mode } from "../lib/modes";
import { ChartIcon, CloseIcon, HelpIcon } from "./icons";

interface Props {
  mode: Mode;
  done: Record<Mode, boolean>;
  onPick: (m: Mode) => void;
  onHelp: () => void;
  onStats: () => void;
  onClose: () => void;
}

/** The ☰ side menu: every daily game, plus how to play and stats. */
export function Menu({ mode, done, onPick, onHelp, onStats, onClose }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fade-in fixed inset-0 z-50 bg-[#0a0d1c]/55 backdrop-blur-[2px]" onClick={onClose}>
      <nav
        ref={panel}
        tabIndex={-1}
        aria-label="Games menu"
        onClick={(e) => e.stopPropagation()}
        className="paper sheet drawer drawer-in absolute inset-y-0 left-0 flex w-[min(330px,86vw)] flex-col overflow-y-auto rounded-r-[22px] px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none"
      >
        <div className="flex items-center justify-between">
          <h2 className="title text-[28px] leading-none">Campusle</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-sunken" aria-label="Close menu">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <h3 className="mt-5 mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-muted">Daily games</h3>
        <ul className="space-y-1.5">
          {MENU.map((item) => {
            const current = item.mode === mode;
            return (
              <li key={item.mode}>
                <button
                  onClick={() => onPick(item.mode)}
                  aria-current={current ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${current ? "bg-sunken ring-2 ring-[color:var(--color-accent)]" : "hover:bg-sunken"}`}
                >
                  <span className="text-[26px] leading-none" aria-hidden>
                    {MODE_CONFIG[item.mode].emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-black">{item.title}</span>
                    <span className="block truncate text-[13px] font-semibold text-muted">{item.blurb}</span>
                  </span>
                  {done[item.mode] ? (
                    <span className="rounded-full bg-[#19a862] px-2 py-0.5 text-[11px] font-black text-white">✓ Done</span>
                  ) : (
                    <span className="text-[12px] font-black uppercase tracking-wider text-muted">Play</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 space-y-1 border-t-2 border-dashed border-line pt-4">
          <button onClick={onHelp} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[15px] font-bold hover:bg-sunken">
            <HelpIcon className="h-5 w-5" /> How to play
          </button>
          <button onClick={onStats} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[15px] font-bold hover:bg-sunken">
            <ChartIcon className="h-5 w-5" /> Statistics
          </button>
        </div>

        <p className="mt-auto pt-6 text-[12px] font-semibold text-muted">New puzzles every day at midnight. All games are free.</p>
      </nav>
    </div>
  );
}
