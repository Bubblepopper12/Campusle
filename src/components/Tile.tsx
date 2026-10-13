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

/** One clue tile. Its look (sticky note or stitched panel) comes from the scene CSS. */
export function Tile({ tile, index, animate, celebrate, kind }: Props) {
  const cls = [
    "tile flex aspect-[1/1.02] min-w-0 flex-col items-center justify-center px-0.5 text-center leading-none select-none",
    `tile-${tile.color}`,
    animate ? "flip-in" : "",
    celebrate ? "hop" : "",
  ].join(" ");

  return (
    <div className={cls} style={{ ["--i" as string]: index }} role="img" aria-label={tile.aria} title={tile.aria}>
      {kind === "location" && !tile.hit && tile.bearing !== undefined && <ArrowIcon className="mb-0.5 h-[17px] w-[17px]" rotate={tile.bearing} />}
      {kind === "colors" ? (
        <Swatches colors={tile.swatches ?? []} />
      ) : (
        <span
          className={[
            "tile-text tracking-tight tabular-nums",
            tile.hit
              ? "text-[26px]"
              : kind === "category"
                ? `${tile.text.length > 7 ? "text-[9.5px]" : "text-[11.5px]"} leading-[1.05] uppercase break-words`
                : tile.text.length >= 5
                  ? "text-[13.5px] sm:text-[16px]"
                  : "text-[15px] sm:text-[17px]",
          ].join(" ")}
        >
          {tile.text}
        </span>
      )}
      {tile.unit && <span className="tile-unit mt-0.5 text-[10px] font-bold uppercase opacity-80">{tile.unit}</span>}
      {kind === "number" && tile.dir && <ArrowIcon className="mt-0.5 h-4 w-4" rotate={tile.dir === "up" ? 0 : 180} />}
    </div>
  );
}

function Swatches({ colors }: { colors: string[] }) {
  if (!colors.length) return <span className="tile-text text-[15px]">?</span>;
  return (
    <span className="flex -space-x-2">
      {colors.slice(0, 3).map((hex, i) => (
        <span key={i} className="h-6 w-6 rounded-full border-2 border-white/90 shadow" style={{ background: hex }} />
      ))}
    </span>
  );
}

export function EmptyTile() {
  return <div className="tile-empty aspect-[1/1.02]" />;
}
