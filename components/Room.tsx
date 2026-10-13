"use client";
import { memo, useId } from "react";
import { ITEM_BY_ID, type ItemId, type SkyPhase, type Slot, type WindowView } from "../content/catalog";
import { ITEM_ART, ITEM_GLOWS } from "./art/items";

// Stage is 1440x900. preserveAspectRatio="slice" crops the side walls on narrow windows,
// never the window or the desk (SPEC §4.3).
const v = (name: string) => `var(--c-${name})`;

export const SLOT_RECTS: Record<Slot, [number, number, number, number]> = {
  lighting: [20, 6, 1400, 78],
  window: [470, 90, 500, 440],
  wall: [1070, 150, 270, 300],
  shelf: [90, 190, 320, 170],
  desk: [280, 450, 280, 160],
  floor: [0, 720, 1440, 180],
};

type Props = {
  room: Partial<Record<Slot, ItemId>>;
  phase: SkyPhase;
  /** undefined: normal view. null or a slot: decorate mode. */
  highlight?: Slot | null;
  onSlot?: (slot: Slot) => void;
  className?: string;
};

function RoomScene({ room, phase, highlight, onSlot, className }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const item = (slot: Slot) => {
    const id = room[slot];
    return id && ITEM_BY_ID[id] ? id : undefined;
  };
  const windowItem = item("window");
  const view: WindowView = (windowItem && (ITEM_BY_ID[windowItem] as { view?: WindowView }).view) || "tower";
  const glows = [{ cx: 1118, cy: 520, r: 300 }, ...(["lighting", "desk"] as const).flatMap((s) => ITEM_GLOWS[item(s) ?? ""] ?? [])];
  const Art = (slot: Slot) => {
    const id = item(slot);
    const C = id ? ITEM_ART[id] : null;
    return C ? <C /> : null;
  };

  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden={onSlot ? undefined : true}>
      <defs>
        <linearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--sky-top)" }} />
          <stop offset="1" style={{ stopColor: "var(--sky-bottom)" }} />
        </linearGradient>
        <radialGradient id={`glow${uid}`}>
          <stop offset="0" style={{ stopColor: "var(--c-glow)", stopOpacity: 0.7 }} />
          <stop offset="1" style={{ stopColor: "var(--c-glow)", stopOpacity: 0 }} />
        </radialGradient>
        <pattern id={`dots${uid}`} width="48" height="48" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="2.5" fill={v("wall-d")} />
          <circle cx="36" cy="36" r="2.5" fill={v("wall-d")} />
        </pattern>
        <clipPath id={`glass${uid}`}>
          <rect x="522" y="118" width="396" height="364" rx="12" />
        </clipPath>
        <mask id={`moon${uid}`}>
          <circle cx="620" cy="190" r="30" fill="white" />
          <circle cx="634" cy="180" r="27" fill="black" />
        </mask>
      </defs>

      {/* wall + floor */}
      <rect width="1440" height="720" fill={v("wall")} />
      <rect width="1440" height="720" fill={`url(#dots${uid})`} opacity="0.5" />
      <rect y="706" width="1440" height="16" fill={v("cream")} />
      <rect y="720" width="1440" height="180" fill={v("floor")} />
      {[770, 820, 870].map((y) => (
        <rect key={y} y={y} width="1440" height="3" fill={v("floor-d")} opacity="0.5" />
      ))}

      {/* window */}
      <rect x="500" y="96" width="440" height="408" rx="22" fill={v("white")} />
      <g clipPath={`url(#glass${uid})`}>
        <rect x="522" y="118" width="396" height="364" fill={`url(#sky${uid})`} />
        <Sky phase={phase} uid={uid} />
        <View view={view} />
      </g>
      <rect x="715" y="118" width="10" height="364" fill={v("white")} />
      <rect x="522" y="295" width="396" height="10" fill={v("white")} />
      <rect x="480" y="496" width="480" height="22" rx="10" fill={v("cream")} />
      <rect x="492" y="516" width="456" height="6" rx="3" fill={v("wall-d")} />
      {Art("window")}

      {/* shelf */}
      <rect x="100" y="330" width="300" height="16" rx="6" fill={v("wood")} />
      <path d="M140 346h22l-22 26Z M338 346h22v26Z" fill={v("wood-d")} />
      {Art("shelf")}

      {Art("wall")}
      {Art("lighting")}
      {Art("floor")}

      {/* desk */}
      <rect x="250" y="676" width="28" height="224" fill={v("desk-d")} />
      <rect x="1162" y="676" width="28" height="224" fill={v("desk-d")} />
      <rect x="226" y="624" width="988" height="54" rx="6" fill={v("desk-d")} />
      <rect x="640" y="646" width="160" height="10" rx="5" fill={v("desk")} />
      <rect x="200" y="600" width="1040" height="28" rx="10" fill={v("desk")} />

      {/* base desk objects: notebooks, pencil cup, lamp */}
      <rect x="610" y="584" width="190" height="16" rx="4" fill={v("lav")} />
      <rect x="622" y="570" width="170" height="14" rx="4" fill={v("cream")} />
      <rect x="622" y="570" width="12" height="14" fill={v("pink")} />
      <rect x="866" y="548" width="7" height="44" rx="3" fill={v("yellow-d")} transform="rotate(-10 869 570)" />
      <rect x="880" y="540" width="7" height="50" rx="3" fill={v("blue-d")} transform="rotate(6 883 565)" />
      <rect x="854" y="560" width="46" height="40" rx="10" fill={v("mint")} />
      <ellipse cx="1100" cy="597" rx="46" ry="8" fill={v("mint-d")} />
      <path d="M1100 596 L1072 506 L1118 450" stroke={v("mint-d")} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M1092 414h52l26 58h-104Z" fill={v("mint")} />
      <ellipse cx="1118" cy="472" rx="20" ry="6" fill={v("yellow")} />
      {Art("desk")}

      {/* time-of-day tint, then lamp glows on top */}
      <rect width="1440" height="900" style={{ fill: "var(--tint)", opacity: "var(--tint-opacity)", mixBlendMode: "multiply" }} />
      {glows.map((g, i) => (
        <circle key={i} cx={g.cx} cy={g.cy} r={g.r} fill={`url(#glow${uid})`} style={{ opacity: "var(--glow)", mixBlendMode: "screen" }} />
      ))}

      {highlight !== undefined &&
        (Object.keys(SLOT_RECTS) as Slot[]).map((slot) => {
          const [x, y, w, h] = SLOT_RECTS[slot];
          const on = slot === highlight;
          return (
            <rect
              key={slot}
              x={x}
              y={y}
              width={w}
              height={h}
              rx="18"
              fill={on ? "var(--primary)" : "transparent"}
              fillOpacity={on ? 0.18 : 0}
              stroke="var(--primary)"
              strokeWidth={on ? 5 : 3}
              strokeDasharray={on ? undefined : "12 10"}
              opacity={on ? 1 : 0.6}
              style={{ cursor: "pointer" }}
              onClick={() => onSlot?.(slot)}
            />
          );
        })}
    </svg>
  );
}

export const Room = memo(RoomScene);

const STARS: [number, number, number][] = [
  [560, 150, 2.5], [600, 250, 1.8], [690, 140, 2], [760, 210, 2.6], [820, 140, 1.6],
  [880, 230, 2.2], [650, 330, 1.6], [860, 330, 2], [560, 380, 1.4], [900, 170, 1.4],
];

function Sky({ phase, uid }: { phase: SkyPhase; uid: string }) {
  const stars = phase === "night" || phase === "predawn" || phase === "twilight";
  return (
    <g>
      {stars &&
        STARS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={v("white")} opacity={phase === "twilight" ? 0.5 : 0.9} />
        ))}
      {phase === "night" && <circle cx="620" cy="190" r="30" fill={v("yellow")} mask={`url(#moon${uid})`} />}
      {phase === "dawn" && (
        <>
          <circle cx="610" cy="450" r="50" fill={v("peach")} opacity="0.9" />
          <circle cx="610" cy="450" r="32" fill={v("yellow")} />
        </>
      )}
      {phase === "morning" && <circle cx="620" cy="230" r="34" fill={v("yellow")} />}
      {phase === "midday" && <circle cx="885" cy="230" r="28" fill={v("cream")} />}
      {phase === "afternoon" && <circle cx="600" cy="280" r="36" fill={v("yellow-d")} opacity="0.85" />}
      {phase === "evening" && <circle cx="640" cy="400" r="58" fill={v("coral")} />}
      {phase === "twilight" && <ellipse cx="720" cy="470" rx="220" ry="40" fill={v("pink")} opacity="0.5" />}
      {(phase === "morning" || phase === "midday" || phase === "afternoon") && (
        <g className="anim-drift" fill={v("white")} opacity="0.9">
          <SkyCloud x={610} y={170} s={0.9} />
          <SkyCloud x={880} y={330} s={0.6} />
        </g>
      )}
    </g>
  );
}

const SkyCloud = ({ x, y, s }: { x: number; y: number; s: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx="-30" cy="6" r="22" />
    <circle cx="4" cy="-8" r="30" />
    <circle cx="36" cy="8" r="20" />
    <rect x="-52" y="6" width="108" height="22" rx="11" />
  </g>
);

/** Distant ivory tower rising from a sea of clouds. Low-poly faces + pixel squares. */
function Tower({ x, scale = 1 }: { x: number; scale?: number }) {
  return (
    <g transform={`translate(${x} 480) scale(${scale})`}>
      <path d="M-34 0 L-20 -270 L0 -270 L0 0Z" fill={v("tower")} />
      <path d="M0 0 L0 -270 L20 -270 L34 0Z" fill={v("tower-d")} />
      <path d="M-26 -270 L0 -330 L0 -270Z" fill={v("lav")} />
      <path d="M0 -330 L26 -270 L0 -270Z" fill={v("lav-d")} />
      <rect x="-28" y="-276" width="56" height="8" fill={v("tower-d")} />
      {[-230, -180, -130, -80].map((y) => (
        <rect key={y} x="-10" y={y} width="7" height="10" fill={v("lav-d")} opacity="0.7" />
      ))}
      {[[-24, -40], [-18, -150], [8, -100], [12, -210], [-14, -240]].map(([px, py], i) => (
        <rect key={i} x={px} y={py} width="6" height="6" fill={v("tower-d")} opacity="0.8" />
      ))}
    </g>
  );
}

function CloudSea({ y }: { y: number }) {
  return (
    <g fill={v("white")}>
      <g className="anim-drift" opacity="0.75">
        {[530, 600, 680, 760, 840, 910].map((x, i) => (
          <circle key={x} cx={x} cy={y + (i % 2) * 10} r={38 + (i % 3) * 8} />
        ))}
      </g>
      <rect x="500" y={y + 20} width="440" height="80" />
    </g>
  );
}

function View({ view }: { view: WindowView }) {
  if (view === "garden") {
    return (
      <g>
        <Tower x={820} scale={0.6} />
        <CloudSea y={440} />
        <rect x="500" y="430" width="440" height="60" rx="20" fill={v("green-d")} />
        {[540, 600, 660, 760, 820, 880].map((x, i) => (
          <circle key={x} cx={x} cy={428} r={30} fill={i % 2 ? v("green") : v("green-d")} />
        ))}
        {[[560, 420, "pink"], [640, 430, "yellow"], [790, 418, "pink"], [870, 432, "white"], [700, 440, "peach"]].map(([x, y, c], i) => (
          <circle key={i} cx={x as number} cy={y as number} r="7" fill={v(c as string)} />
        ))}
      </g>
    );
  }
  if (view === "sea") {
    return (
      <g>
        <Tower x={820} scale={0.55} />
        <rect x="500" y="400" width="440" height="100" fill={v("blue-d")} opacity="0.75" />
        {[420, 445, 470].map((y, i) => (
          <rect key={y} x={540 + i * 40} y={y} width={120 - i * 20} height="4" rx="2" fill={v("white")} opacity="0.6" />
        ))}
        <path d="M590 404 L598 300 L622 300 L630 404Z" fill={v("white")} />
        <rect x="594" y="330" width="32" height="14" fill={v("pink")} />
        <rect x="592" y="368" width="36" height="14" fill={v("pink")} />
        <rect x="594" y="284" width="32" height="18" fill={v("yellow")} />
        <path d="M590 286 L610 264 L630 286Z" fill={v("lav-d")} />
      </g>
    );
  }
  return (
    <g>
      <Tower x={810} />
      <CloudSea y={430} />
    </g>
  );
}

