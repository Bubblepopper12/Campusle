import type { TileResult } from "../lib/feedback";
import type { Column, Entity } from "../lib/modes";
import { MAX_GUESSES } from "../lib/stats";
import { EmptyTile, Tile } from "./Tile";

interface Props {
  columns: Column[];
  guesses: Entity[];
  rowMeta: (e: Entity) => string;
  rows: TileResult[][];
  /** Index of the row that should animate in (the newest guess this session). */
  animateRow: number;
  wonRow: number;
}

export function Board({ columns, guesses, rowMeta, rows, animateRow, wonRow }: Props) {
  const empty = Math.max(0, MAX_GUESSES - rows.length);
  return (
    <section aria-label="Your guesses" className="mt-4">
      <div className="grid grid-cols-6 gap-1.5 px-1.5 pb-1.5">
        {columns.map((c) => (
          <div key={c.label} className="flex flex-col items-center gap-0.5 text-center" title={c.help}>
            <span className="text-[15px] leading-none" aria-hidden>
              {c.icon}
            </span>
            <span className="col-label text-[9.5px] font-black uppercase tracking-wide">{c.label}</span>
          </div>
        ))}
      </div>

      <ol className="flex flex-col gap-2.5">
        {rows.map((row, r) => (
          <li key={guesses[r].id} className="row-panel">
            <div className="mb-1 flex items-baseline gap-2 px-0.5">
              <span className="row-meta text-[12px] font-bold">{r + 1}</span>
              <span className="row-label truncate text-[14px] font-extrabold">{guesses[r].short}</span>
              <span className="row-meta ml-auto shrink-0 text-[11px] font-semibold">
                {rowMeta(guesses[r])}
              </span>
            </div>
            <div className="tile-row grid grid-cols-6 gap-1.5">
              {row.map((tile, i) => (
                <Tile key={i} tile={tile} index={i} kind={columns[i].kind} animate={r === animateRow} celebrate={r === wonRow && r === animateRow} />
              ))}
            </div>
          </li>
        ))}
        {Array.from({ length: empty }, (_, i) => (
          <li key={`empty-${i}`} aria-hidden className={`row-panel ${i === 0 ? "" : "opacity-70"}`}>
            <div className="mb-1 h-[18px] px-0.5">
              <span className="row-meta text-[12px] font-bold opacity-70">{rows.length + i + 1}</span>
            </div>
            <div className="tile-row grid grid-cols-6 gap-1.5">
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
