import type { TileResult } from "../lib/feedback";
import type { ColumnKind } from "../lib/modes";
import { ArrowIcon } from "./icons";

interface Props {
  tile: TileResult;
  index: number;
  animate: boolean;
  celebrate?: boolean;
  /** Location tiles show a compass arrow; the rest show up/down arrows. */
  kind: ColumnKind;
}

export function Tile({ tile, index, animate, celebrate, kind }: Props) {
  const cls = [
    "tile relative flex aspect-[1/1.02] min-w-0 flex-col items-center justify-center rounded-[11px] px-0.5 text-center leading-none select-none",
    `tile-${tile.color}`,
    animate ? "flip-in" : "",
    celebrate ? "hop" : "",
  ].join(" ");

  return (
    <div className={cls} style={{ ["--i" as string]: index }} role="img" aria-label={tile.aria} title={tile.aria}>
      {kind === "location" && !tile.hit && tile.bearing !== undefined && (
        <ArrowIcon className="mb-0.5 h-[18px] w-[18px] drop-shadow-sm" rotate={tile.bearing} />
      )}
      {kind === "colors" ? (
        <Swatches colors={tile.swatches ?? []} />
      ) : (
        <span
          className={[
            "font-extrabold tracking-tight tabular-nums",
            tile.hit
              ? "text-[26px]"
              : kind === "category"
                ? `${tile.text.length > 7 ? "text-[9.5px]" : "text-[11.5px]"} leading-[1.05] font-black uppercase break-words`
                : tile.text.length >= 6
                  ? "text-[13.5px] sm:text-[16px]"
                  : "text-[15px] sm:text-[17px]",
          ].join(" ")}
        >
          {tile.text}
        </span>
      )}
      {tile.unit && <span className="mt-0.5 text-[10px] font-bold uppercase opacity-80">{tile.unit}</span>}
      {kind === "number" && tile.dir && <ArrowIcon className="mt-0.5 h-4 w-4" rotate={tile.dir === "up" ? 0 : 180} />}
    </div>
  );
}

function Swatches({ colors }: { colors: string[] }) {
  if (!colors.length) return <span className="text-[15px] font-extrabold">?</span>;
  return (
    <span className="flex -space-x-2">
      {colors.slice(0, 3).map((hex, i) => (
        <span key={i} className="h-6 w-6 rounded-full border-2 border-white/90 shadow" style={{ background: hex }} />
      ))}
    </span>
  );
}

export function EmptyTile() {
  return <div className="aspect-[1/1.02] rounded-[11px] border-2 border-dashed border-line bg-t-empty/60" />;
}
