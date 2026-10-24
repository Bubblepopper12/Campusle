import { useId } from "react";
import { COLLEGE_BY_ID, PLAYER_BY_ID, TEAM_BY_ID } from "../lib/data";

const SHELL = "M24 80 C14 52 34 13 78 11 C114 9 140 31 142 57 L142 61 C131 60 119 61 110 65 C104 72 102 82 105 92 L98 100 C82 105 63 103 54 97 C46 92 40 90 33 90 C27 89 24 86 24 80 Z";
const STRIPE = "M31 62 C34 36 55 20 80 19 C108 18 129 35 135 59";
const MASK = ["M134 61 C144 61 151 63 153 67 L152 96 C150 101 144 103 136 103 L104 98", "M110 77 L152 79", "M133 62 L131 102"];
const STRAP = "M96 95 C104 106 116 110 128 109";

/** A glossy right-facing football helmet in the team's colors, with the player's number on the side. */
function Helmet({ shell, stripe, number }: { shell: string; stripe: string; number: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden>
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={SHELL} />
        </clipPath>
        <radialGradient id={`${id}-gloss`} cx="0.32" cy="0.18" r="0.85">
          <stop offset="0" stopColor="#fff" stopOpacity="0.38" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000" stopOpacity="0.32" />
        </radialGradient>
        <linearGradient id={`${id}-mask`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f4f6" />
          <stop offset="1" stopColor="#b9bcc4" />
        </linearGradient>
      </defs>
      <ellipse cx="82" cy="112" rx="56" ry="5" fill="rgb(0 0 0 / 0.28)" />

      {/* Facemask, outlined so it reads on any shell color */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {MASK.map((d) => (
          <path key={d} d={d} stroke="rgb(0 0 0 / 0.45)" strokeWidth="7" />
        ))}
        {MASK.map((d) => (
          <path key={d} d={d} stroke={`url(#${id}-mask)`} strokeWidth="4.5" />
        ))}
      </g>

      {/* Shell: jaw panel, center stripe with pinstripe, gloss, bottom padding */}
      <path d={SHELL} fill={shell} />
      <g clipPath={`url(#${id}-clip)`}>
        <path d="M30 92 C40 76 62 64 110 65 L120 120 L20 120 Z" fill="rgb(0 0 0 / 0.16)" />
        <path d="M30 92 C40 76 62 64 110 65" fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="1.2" />
        <path d={STRIPE} fill="none" stroke="rgb(0 0 0 / 0.35)" strokeWidth="14" />
        <path d={STRIPE} fill="none" stroke={stripe} strokeWidth="11" />
        <path d={STRIPE} fill="none" stroke={shell} strokeWidth="3" />
        <rect width="160" height="120" fill={`url(#${id}-gloss)`} />
        <path d="M24 80 C24 86 27 89 33 90 C40 90 46 92 54 97 C63 103 82 105 98 100" fill="none" stroke="rgb(0 0 0 / 0.4)" strokeWidth="5" />
      </g>
      <path d={SHELL} fill="none" stroke="rgb(0 0 0 / 0.5)" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M110 65 C119 61 131 60 142 61" fill="none" stroke="#1b1b22" strokeWidth="4" strokeLinecap="round" />

      <path d="M47 47 C54 37 64 31 77 29" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="44" cy="54" r="2.2" fill="#fff" fillOpacity="0.45" />
      <text x="96" y="56" textAnchor="middle" fontFamily="Anton, Impact, sans-serif" fontSize="22" fill={stripe} stroke="rgb(0 0 0 / 0.35)" strokeWidth="0.8" paintOrder="stroke">
        {number}
      </text>

      {/* Ear hole */}
      <circle cx="72" cy="72" r="7.5" fill="rgb(255 255 255 / 0.16)" />
      <circle cx="72" cy="72" r="5" fill="#15131c" />
      <circle cx="70.6" cy="70.6" r="1.4" fill="#fff" fillOpacity="0.35" />

      {/* Mask clips */}
      <rect x="129" y="57.5" width="9" height="7" rx="2" fill="#2a2a33" />
      <rect x="106" y="73" width="7" height="7" rx="2" fill="#2a2a33" />
      <rect x="103" y="93" width="8" height="8" rx="2" fill="#2a2a33" transform="rotate(-12 107 97)" />

      {/* Chin strap and cup */}
      <path d={STRAP} fill="none" stroke="#f1f1f3" strokeWidth="3" strokeLinecap="round" />
      <path d={STRAP} fill="none" stroke="rgb(0 0 0 / 0.25)" strokeWidth="1" strokeDasharray="2 3" />
      <ellipse cx="134" cy="108" rx="9" ry="5.5" fill="#f1f1f3" stroke="rgb(0 0 0 / 0.35)" strokeWidth="1.2" />
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
          <Helmet shell={primary} stripe={stripe} number={p.jersey} />
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
