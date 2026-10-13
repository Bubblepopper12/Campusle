import { MODE_CONFIG, type Mode } from "../lib/modes";
import { MAX_GUESSES, visibleStreak, type Stats } from "../lib/stats";
import type { Status } from "../useGame";
import { Countdown } from "./Countdown";
import { Modal } from "./Modal";
import { ShareIcon } from "./icons";

interface Props {
  mode: Mode;
  stats: Stats;
  puzzle: number;
  status: Status;
  guessCount: number;
  onShare: () => void;
  onClose: () => void;
}

export function StatsModal({ mode, stats, puzzle, status, guessCount, onShare, onClose }: Props) {
  const cfg = MODE_CONFIG[mode];
  const winPct = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;
  const max = Math.max(1, ...stats.distribution);
  const todayBar = status === "won" ? guessCount - 1 : status === "lost" ? MAX_GUESSES : -1;
  const boxes = [
    { label: "Played", value: stats.played },
    { label: "Win %", value: winPct },
    { label: "Streak", value: visibleStreak(stats, puzzle) },
    { label: "Best", value: stats.maxStreak },
  ];

  return (
    <Modal title={`${cfg.emoji} ${cfg.name} stats`} onClose={onClose}>
      <div className="grid grid-cols-4 gap-2">
        {boxes.map((b) => (
          <div key={b.label} className="rounded-2xl bg-sunken py-3 text-center">
            <div className="title text-[28px] leading-none">{b.value}</div>
            <div className="mt-1 text-[11px] font-black uppercase tracking-wider text-muted">{b.label}</div>
          </div>
        ))}
      </div>

      <h3 className="mt-5 mb-2 text-[12px] font-black uppercase tracking-wider text-muted">Guess distribution</h3>
      <div className="space-y-1.5">
        {stats.distribution.slice(0, MAX_GUESSES + 1).map((count, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-4 text-center text-[14px] font-black">{i === MAX_GUESSES ? "X" : i + 1}</span>
            <div className="flex-1">
              <div
                className={`flex h-6 min-w-7 items-center justify-end rounded-md px-2 text-[13px] font-extrabold ${
                  i === todayBar ? "bar-today" : "bar"
                }`}
                style={{ width: `${Math.max(8, (count / max) * 100)}%` }}
              >
                {count}
              </div>
            </div>
          </div>
        ))}
      </div>

      {status !== "playing" && (
        <div className="mt-5 flex items-center gap-3 border-t-2 border-dashed border-line pt-4">
          <div className="flex-1">
            <div className="text-[11px] font-black uppercase tracking-wider text-muted">Next {cfg.name}</div>
            <Countdown className="text-[24px]" />
          </div>
          <button onClick={onShare} className="btn btn-primary flex items-center gap-2 px-5 py-3 text-[17px]">
            Share <ShareIcon className="h-5 w-5" />
          </button>
        </div>
      )}
      <p className="mt-4 text-center text-[12px] text-muted">Stats are saved on this device only.</p>
    </Modal>
  );
}
