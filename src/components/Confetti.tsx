import { useMemo } from "react";

/** Lightweight CSS confetti. Pieces fall once and the parent unmounts this after a few seconds. */
export function Confetti({ colors }: { colors: string[] }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 110 }, (_, i) => ({
        left: Math.random() * 100,
        color: colors[i % colors.length],
        w: 6 + Math.random() * 7,
        h: 8 + Math.random() * 10,
        round: Math.random() < 0.25,
        delay: Math.random() * 0.6,
        dur: 2.2 + Math.random() * 1.6,
        drift: (Math.random() - 0.5) * 160,
        spin: (Math.random() - 0.5) * 1440,
      })),
    [colors],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.w,
            height: p.round ? p.w : p.h,
            background: p.color,
            borderRadius: p.round ? "50%" : 2,
            ["--delay" as string]: `${p.delay}s`,
            ["--dur" as string]: `${p.dur}s`,
            ["--drift" as string]: `${p.drift}px`,
            ["--spin" as string]: `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}
