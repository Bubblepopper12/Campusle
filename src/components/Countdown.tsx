import { useEffect, useState } from "react";
import { msUntilNextPuzzle } from "../lib/daily";

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({ onExpire, className = "" }: { onExpire?: () => void; className?: string }) {
  const [ms, setMs] = useState(() => msUntilNextPuzzle());
  useEffect(() => {
    const t = setInterval(() => {
      const left = msUntilNextPuzzle();
      setMs(left);
      if (left > 86_390_000) onExpire?.();
    }, 1000);
    return () => clearInterval(t);
  }, [onExpire]);
  const s = Math.floor(ms / 1000);
  return (
    <span className={`font-display tabular-nums ${className}`}>
      {pad(Math.floor(s / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}
    </span>
  );
}
