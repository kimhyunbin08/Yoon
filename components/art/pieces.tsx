import type { ReactNode } from "react";
import { PIECE_BY_ID, type PieceId } from "../../content/catalog";

// Original 64x64 piece art. Flat fills only, colors from the --c-* palette.
const v = (name: string) => `var(--c-${name})`;

const Cloud = ({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
    <circle cx="-10" cy="2" r="9" />
    <circle cx="2" cy="-4" r="12" />
    <circle cx="13" cy="3" r="8" />
    <rect x="-19" y="2" width="40" height="9" rx="4.5" />
  </g>
);

const ART: Record<PieceId, ReactNode> = {
  dew: (
    <>
      <path d="M32 8C32 8 15 29 15 40a17 17 0 0 0 34 0C49 29 32 8 32 8Z" fill={v("blue")} />
      <path d="M32 8C32 8 49 29 49 40a17 17 0 0 1-17 17V8Z" fill={v("blue-d")} opacity="0.5" />
      <ellipse cx="25" cy="40" rx="4" ry="7" fill={v("white")} opacity="0.8" />
    </>
  ),
  sunbeam: (
    <>
      {[0, 30, 60, 90, 120, 150, 180].map((a) => (
        <rect key={a} x="30" y="6" width="4" height="12" rx="2" fill={v("yellow-d")} transform={`rotate(${a - 90} 32 44)`} />
      ))}
      <path d="M12 44a20 20 0 0 1 40 0Z" fill={v("peach")} />
      <path d="M20 44a12 12 0 0 1 24 0Z" fill={v("yellow")} />
      <rect x="8" y="44" width="48" height="5" rx="2.5" fill={v("peach-d")} />
    </>
  ),
  mug: (
    <>
      <path className="anim-steam" d="M26 18c-3-4 3-6 0-10M36 18c-3-4 3-6 0-10" stroke={v("wall-d")} strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="14" y="24" width="30" height="30" rx="8" fill={v("pink")} />
      <path d="M44 31h4a7 7 0 0 1 0 14h-4" stroke={v("pink-d")} strokeWidth="5" fill="none" />
      <rect x="14" y="24" width="30" height="7" rx="3.5" fill={v("pink-d")} />
      <rect x="10" y="54" width="38" height="4" rx="2" fill={v("wall-d")} />
    </>
  ),
  feather: (
    <>
      <path d="M48 10C30 12 16 28 16 46l4 4c18 0 32-16 30-36Z" fill={v("lav")} />
      <path d="M48 10C40 24 30 36 18 48" stroke={v("lav-d")} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M30 30l-6-2M36 24l-5-3M26 38l-6 0" stroke={v("white")} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <path d="M18 48l-6 6" stroke={v("lav-d")} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  "pink-cloud": (
    <>
      <Cloud x={32} y={34} s={1.15} fill={v("pink")} />
      <circle cx="28" cy="27" r="5" fill={v("white")} opacity="0.6" />
    </>
  ),
  "sunrise-marble": (
    <>
      <circle cx="32" cy="32" r="24" fill={v("peach")} />
      <path d="M8 34h48a24 24 0 0 1-48 0Z" fill={v("pink")} />
      <path d="M20 34a12 12 0 0 1 24 0Z" fill={v("yellow")} />
      <path d="M12 42h40M16 48h32" stroke={v("pink-d")} strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="22" cy="20" rx="6" ry="4" fill={v("white")} opacity="0.75" transform="rotate(-30 22 20)" />
    </>
  ),

  cloud: (
    <>
      <Cloud x={32} y={34} s={1.15} fill={v("blue")} />
      <Cloud x={31} y={31} s={1.05} fill={v("white")} />
    </>
  ),
  pencil: (
    <g transform="rotate(-45 32 32)">
      <rect x="26" y="10" width="12" height="34" fill={v("yellow")} />
      <rect x="32" y="10" width="6" height="34" fill={v("yellow-d")} />
      <rect x="26" y="4" width="12" height="8" rx="3" fill={v("pink")} />
      <path d="M26 44h12l-6 14Z" fill={v("desk")} />
      <path d="M30 53h4l-2 5Z" fill={v("ink")} />
    </g>
  ),
  sprout: (
    <>
      <ellipse cx="32" cy="52" rx="20" ry="6" fill={v("wood")} />
      <path d="M32 52V30" stroke={v("green-d")} strokeWidth="4" strokeLinecap="round" />
      <path d="M32 34C22 34 14 28 14 18c10 0 18 6 18 16Z" fill={v("green")} />
      <path d="M32 30c0-10 8-16 18-16 0 10-8 16-18 16Z" fill={v("green-d")} />
    </>
  ),
  "paper-plane": (
    <>
      <path d="M6 30L58 10 40 54 30 38Z" fill={v("white")} />
      <path d="M30 38L58 10 26 50Z" fill={v("blue")} />
      <path d="M6 30l24 8 28-28" stroke={v("blue-d")} strokeWidth="2" fill="none" strokeLinejoin="round" />
    </>
  ),
  "lemon-candy": (
    <>
      <path d="M18 32L6 22v20Z" fill={v("yellow-d")} />
      <path d="M46 32l12-10v20Z" fill={v("yellow-d")} />
      <circle cx="32" cy="32" r="16" fill={v("yellow")} />
      <path d="M20 26c8 4 16 4 24 0M20 38c8-4 16-4 24 0" stroke={v("white")} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
    </>
  ),
  rainbow: (
    <>
      {[
        ["pink", 26],
        ["peach", 21],
        ["yellow", 16],
        ["mint", 11],
        ["blue", 6],
      ].map(([c, r]) => (
        <path key={c} d={`M${32 - +r} 46a${r} ${r} 0 0 1 ${+r * 2} 0`} stroke={v(c as string)} strokeWidth="5" fill="none" />
      ))}
      <Cloud x={10} y={46} s={0.6} fill={v("white")} />
      <Cloud x={54} y={46} s={0.6} fill={v("white")} />
    </>
  ),

  "sunset-glass": (
    <>
      <path d="M14 18L44 10 54 42 22 54Z" fill={v("coral")} />
      <path d="M17 29L48 20 51 31 20 42Z" fill={v("peach")} />
      <path d="M19 38L50 28 52 36 21 47Z" fill={v("lav")} />
      <path d="M20 20l8-2-6 12Z" fill={v("white")} opacity="0.7" />
    </>
  ),
  "warm-light": (
    <>
      <circle cx="32" cy="26" r="22" fill={v("glow")} opacity="0.6" />
      <circle cx="32" cy="26" r="14" fill={v("yellow")} />
      <rect x="25" y="38" width="14" height="10" rx="3" fill={v("wall-d")} />
      <rect x="27" y="48" width="10" height="5" rx="2.5" fill={v("wood-d")} />
      <circle cx="27" cy="21" r="4" fill={v("white")} opacity="0.8" />
    </>
  ),
  "maple-leaf": (
    <>
      <path d="M32 6l5 12 9-5-2 12 12 1-9 9 5 7-14-2-4 12-4-12-14 2 5-7-9-9 12-1-2-12 9 5Z" fill={v("coral")} />
      <path d="M32 18v40M32 34l-10-6M32 34l10-6" stroke={v("peach")} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  "cat-bell": (
    <>
      <path d="M14 18h36l-4 8H18Z" fill={v("pink")} />
      <circle cx="32" cy="38" r="15" fill={v("yellow-d")} />
      <path d="M17 40h30" stroke={v("wood-d")} strokeWidth="3" />
      <circle cx="32" cy="46" r="3" fill={v("wood-d")} />
      <circle cx="26" cy="31" r="4" fill={v("white")} opacity="0.8" />
    </>
  ),
  cocoa: (
    <>
      <rect x="14" y="24" width="30" height="30" rx="8" fill={v("wood")} />
      <path d="M44 31h4a7 7 0 0 1 0 14h-4" stroke={v("wood-d")} strokeWidth="5" fill="none" />
      <ellipse cx="29" cy="25" rx="15" ry="4" fill={v("wood-d")} />
      <rect x="20" y="16" width="9" height="9" rx="3" fill={v("white")} />
      <rect x="29" y="18" width="9" height="9" rx="3" fill={v("pink")} />
    </>
  ),
  "sunset-cat": (
    <>
      <circle cx="32" cy="34" r="24" fill={v("coral")} />
      <path d="M18 54V30l6-12 6 10h4l6-10 6 12v24Z" fill={v("lav-d")} />
      <path d="M24 38c2-2 4-2 6 0M34 38c2-2 4-2 6 0" stroke={v("cream")} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="32" cy="44" rx="2" ry="1.5" fill={v("pink")} />
    </>
  ),

  star: (
    <>
      <path d="M32 6l7.6 16.4 17.9 2-13.3 12.2 3.8 17.6L32 45.2 16 54.2l3.8-17.6L6.5 24.4l17.9-2Z" fill={v("yellow")} />
      <path d="M32 6l7.6 16.4 17.9 2-13.3 12.2 3.8 17.6L32 45.2Z" fill={v("yellow-d")} opacity="0.5" />
    </>
  ),
  candle: (
    <>
      <circle cx="32" cy="16" r="12" fill={v("glow")} opacity="0.5" />
      <path className="anim-flicker" d="M32 6c5 6 5 11 0 14-5-3-5-8 0-14Z" fill={v("yellow-d")} />
      <rect x="22" y="24" width="20" height="30" rx="5" fill={v("lav")} />
      <path d="M26 24v8" stroke={v("cream")} strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="32" cy="55" rx="16" ry="4" fill={v("wall-d")} />
    </>
  ),
  firefly: (
    <>
      <circle cx="30" cy="40" r="20" fill={v("glow")} opacity="0.55" />
      <circle cx="30" cy="40" r="9" fill={v("yellow")} />
      <ellipse cx="38" cy="26" rx="10" ry="7" fill={v("mint-d")} />
      <ellipse cx="24" cy="22" rx="9" ry="5" fill={v("white")} opacity="0.8" transform="rotate(-25 24 22)" />
      <ellipse cx="40" cy="18" rx="9" ry="5" fill={v("white")} opacity="0.8" transform="rotate(25 40 18)" />
    </>
  ),
  moon: (
    <>
      <path d="M40 8a24 24 0 1 0 16 38A20 20 0 0 1 40 8Z" fill={v("yellow")} />
      <circle cx="24" cy="38" r="4" fill={v("yellow-d")} opacity="0.6" />
      <circle cx="32" cy="48" r="2.5" fill={v("yellow-d")} opacity="0.6" />
    </>
  ),
  letter: (
    <>
      <rect x="8" y="16" width="48" height="34" rx="5" fill={v("blue")} />
      <path d="M8 20l24 18 24-18" stroke={v("white")} strokeWidth="3" fill="none" strokeLinejoin="round" />
      <path d="M32 40c-6-5-9-8-6-11 2-2 5-1 6 1 1-2 4-3 6-1 3 3 0 6-6 11Z" fill={v("pink-d")} />
    </>
  ),
  aurora: (
    <>
      <path d="M4 40C14 20 24 20 32 32s18 12 28-8v14C50 58 40 52 32 44S14 36 4 54Z" fill={v("mint")} />
      <path d="M4 28C14 12 24 12 32 22s18 10 28-8v10C50 40 40 36 32 30S14 24 4 40Z" fill={v("lav")} />
      <path d="M8 14c8-6 16-4 24 2s16 6 24-2" stroke={v("blue")} strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="48" r="2" fill={v("white")} />
      <circle cx="14" cy="10" r="1.5" fill={v("white")} />
    </>
  ),
};

export function PieceIcon({ id, size = 48, locked = false }: { id: PieceId; size?: number; locked?: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={locked ? "아직 없는 조각" : PIECE_BY_ID[id].nameKo}
      style={locked ? { filter: "var(--silhouette)", opacity: 0.15 } : undefined}
    >
      {ART[id]}
    </svg>
  );
}
