import { COLLEGE_BY_ID, PLAYER_BY_ID, TEAM_BY_ID } from "../lib/data";

/** A simple right-facing football helmet in the team's colors. */
function Helmet({ shell, stripe }: { shell: string; stripe: string }) {
  return (
    <svg viewBox="0 0 124 92" className="h-full w-full drop-shadow-[0_6px_8px_rgb(0_0_0/0.35)]" aria-hidden>
      <path d="M12 56 C12 26 36 8 64 8 C93 8 112 29 112 53 C112 61 110 67 106 71 L82 71 L76 61 L60 61 C58 74 49 84 35 84 C20 84 12 72 12 56 Z" fill={shell} stroke="rgb(0 0 0 / 0.35)" strokeWidth="2" />
      <path d="M54 9.5 C80 10 101 24 109 44" fill="none" stroke={stripe} strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="42" cy="26" rx="18" ry="8" fill="rgb(255 255 255 / 0.28)" transform="rotate(-20 42 26)" />
      <circle cx="44" cy="56" r="5" fill="rgb(0 0 0 / 0.35)" />
      <g fill="none" stroke="#e7e7ea" strokeWidth="4" strokeLinecap="round">
        <path d="M80 61 H118" />
        <path d="M80 72 L116 74" />
        <path d="M117 56 V80" />
        <path d="M104 50 L118 56" />
      </g>
    </svg>
  );
}

/** The player's card, pulled from the pack at the end of a Players game. */
export function TradingCard({ playerId, serial }: { playerId: string; serial: string }) {
  const p = PLAYER_BY_ID.get(playerId);
  if (!p) return null;
  const school = COLLEGE_BY_ID.get(p.schools[0]);
  const colors = TEAM_BY_ID.get(p.schools[0])?.colors.map((c) => c.hex) ?? ["#5b21b6", "#f5c542"];
  const [primary, secondary = "#ffffff"] = colors;
  const stripe = secondary.toUpperCase() === "#FFFFFF" && colors[2] ? colors[2] : secondary;

  return (
    <div className="tcard holo card-pull">
      <div className="tcard-inner" style={{ background: `linear-gradient(165deg, ${primary} 0%, ${primary} 55%, #0d0820 140%)` }}>
        {/* Big jersey number watermark */}
        <div className="card-font pointer-events-none absolute -right-2 top-6 text-[130px] leading-none text-white/12 select-none">{p.jersey}</div>

        <div className="relative flex items-start justify-between p-2.5">
          <div className="card-font max-w-[70%] rounded-md bg-black/35 px-2 py-0.5 text-[13px] leading-tight tracking-[0.08em] uppercase">{school?.short}</div>
          <div className="card-font grid h-10 w-10 place-items-center rounded-full text-[15px] text-[#16101f]" style={{ background: stripe }}>
            {p.position}
          </div>
        </div>

        <div className="relative mx-auto mt-1 h-[38%] w-[78%]">
          <Helmet shell={primary} stripe={stripe} />
        </div>

        {p.heisman.length > 0 && (
          <div className="card-font holo absolute top-[56%] left-2.5 rotate-[-8deg] rounded-md px-2 py-0.5 text-[11px] tracking-[0.1em] text-[#1d1233] shadow-lg">
            🏆 HEISMAN {p.heisman.join(" · ")}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <div className="rounded-lg bg-black/55 px-2.5 py-2 backdrop-blur-[1px]" style={{ boxShadow: `inset 0 3px 0 ${stripe}` }}>
            <div className="card-font text-[24px] leading-[1] tracking-[0.02em] uppercase">{p.name}</div>
            <div className="mt-1 flex items-center justify-between text-[11px] font-bold text-white/80">
              <span>
                #{p.jersey} · {p.active ? "Playing now" : `Final season ${p.lastSeason}`}
              </span>
              <span className="card-font tracking-[0.1em] text-white/60">{serial}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
