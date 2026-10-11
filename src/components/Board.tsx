import type { College } from "../lib/types";
import type { TileResult } from "../lib/feedback";
import type { Column } from "../lib/modes";
import { MAX_GUESSES } from "../lib/stats";
import { EmptyTile, Tile } from "./Tile";

interface Props {
  columns: Column[];
  guesses: College[];
  rows: TileResult[][];
  /** Index of the row that should flip in (the newest guess this session). */
  animateRow: number;
  wonRow: number;
}

export function Board({ columns, guesses, rows, animateRow, wonRow }: Props) {
  const empty = Math.max(0, MAX_GUESSES - rows.length);
  return (
    <section aria-label="Your guesses" className="mt-4">
      <div className="grid grid-cols-6 gap-1.5 px-0.5 pb-1.5">
        {columns.map((c) => (
          <div key={c.label} className="flex flex-col items-center gap-0.5 text-center" title={c.help}>
            <span className="text-[15px] leading-none" aria-hidden>
              {c.icon}
            </span>
            <span className="text-[9.5px] font-black uppercase tracking-wide text-muted">{c.label}</span>
          </div>
        ))}
      </div>

      <ol className="flex flex-col gap-2.5">
        {rows.map((row, r) => (
          <li key={guesses[r].id}>
            <div className="mb-1 flex items-baseline gap-2 px-0.5">
              <span className="font-display text-[12px] text-muted">{r + 1}</span>
              <span className="truncate text-[14px] font-extrabold">{guesses[r].short}</span>
              <span className="ml-auto shrink-0 text-[11px] font-semibold text-muted">
                {guesses[r].city}, {guesses[r].state}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {row.map((tile, i) => (
                <Tile key={i} tile={tile} index={i} kind={columns[i].kind} animate={r === animateRow} celebrate={r === wonRow && r === animateRow} />
              ))}
            </div>
          </li>
        ))}
        {Array.from({ length: empty }, (_, i) => (
          <li key={`empty-${i}`} aria-hidden className={i === 0 ? "" : "opacity-60"}>
            <div className="mb-1 h-[17px] px-0.5">
              <span className="font-display text-[12px] text-muted/60">{rows.length + i + 1}</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({ length: 6 }, (_, j) => (
                <EmptyTile key={j} />
              ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
