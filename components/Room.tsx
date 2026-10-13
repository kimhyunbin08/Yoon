"use client";
import { memo, useId, type ReactNode } from "react";
import { ITEM_BY_ID, type ItemId, type SkyPhase, type Slot, type WindowView } from "../content/catalog";
import { ITEM_ART, ITEM_GLOWS } from "./art/items";

// Stage is 1440x900. preserveAspectRatio="slice" crops the side walls on narrow windows,
// never the window or the desk (SPEC §4.3). Inside `.room` the art palette maps to paper whites
// (globals.css); color comes only from the sky, window light, shade, and lamp glows.
const v = (name: string) => `var(--c-${name})`;

export const SLOT_RECTS: Record<Slot, [number, number, number, number]> = {
  lighting: [20, 6, 1400, 78],
  window: [470, 90, 500, 440],
  wall: [1070, 150, 270, 300],
  shelf: [90, 190, 320, 170],
  desk: [280, 450, 280, 160],
  floor: [0, 720, 1440, 180],
};

// Light shaft from the window glass, falling diagonally down-right to the floor.
const WINDOW_LIGHT = "M522 118 L918 118 L1348 900 L752 900 L522 482 Z";

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
  const view: WindowView = (windowItem && (ITEM_BY_ID[windowItem] as { view?: WindowView }).view) || "hills";
  const glows = [{ cx: 1118, cy: 520, r: 300 }, ...(["lighting", "desk"] as const).flatMap((s) => ITEM_GLOWS[item(s) ?? ""] ?? [])];
  const Art = (slot: Slot) => {
    const id = item(slot);
    const C = id ? ITEM_ART[id] : null;
    return C ? <C /> : null;
  };
  const pencil = `url(#pencil${uid})`;

  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className={`room ${className ?? ""}`}
      aria-hidden={onSlot ? undefined : true}
    >
      <defs>
        <linearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--sky-top)" }} />
          <stop offset="1" style={{ stopColor: "var(--sky-bottom)" }} />
        </linearGradient>
        <radialGradient id={`glow${uid}`}>
          <stop offset="0" style={{ stopColor: "var(--c-glow)", stopOpacity: 0.7 }} />
          <stop offset="1" style={{ stopColor: "var(--c-glow)", stopOpacity: 0 }} />
        </radialGradient>
        {/* window light fades from the glass to the floor */}
        <linearGradient id={`light${uid}`} gradientUnits="userSpaceOnUse" x1="720" y1="118" x2="1050" y2="900">
          <stop offset="0" style={{ stopColor: "var(--light)", stopOpacity: 1 }} />
          <stop offset="1" style={{ stopColor: "var(--light)", stopOpacity: 0.45 }} />
        </linearGradient>
        {/* colored-pencil lines: a slow wobble plus grain punched into the strokes */}
        <filter id={`pencil${uid}`} filterUnits="userSpaceOnUse" x="0" y="0" width="1440" height="900">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="4" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="3" xChannelSelector="R" yChannelSelector="G" result="wobble" />
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="9" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.75" result="grainMask" />
          <feComposite in="wobble" in2="grainMask" operator="in" />
        </filter>
        <clipPath id={`glass${uid}`}>
          <rect x="522" y="118" width="396" height="364" rx="12" />
        </clipPath>
        <mask id={`shade${uid}`}>
          <rect width="1440" height="900" fill="white" />
          <path d={WINDOW_LIGHT} fill="black" />
        </mask>
        {/* window light paints the room, not the glass (the sky already carries its color) */}
        <mask id={`light-mask${uid}`}>
          <path d={WINDOW_LIGHT} fill="white" />
          <rect x="522" y="118" width="396" height="364" rx="12" fill="black" />
        </mask>
        <mask id={`moon${uid}`}>
          <circle cx="620" cy="190" r="30" fill="white" />
          <circle cx="634" cy="180" r="27" fill="black" />
        </mask>
      </defs>

      {/* wall + floor: paper white */}
      <rect width="1440" height="720" fill={v("wall")} />
      <rect y="720" width="1440" height="180" fill={v("floor")} />
      <ellipse cx="720" cy="892" rx="560" ry="24" style={{ fill: "var(--shade)", opacity: 0.18, mixBlendMode: "multiply" }} />

      {/* window view: outlined too, clipped to the glass */}
      <g clipPath={`url(#glass${uid})`}>
        {/* the sky itself stays smooth; pencil grain on a large flat fill reads as TV static */}
        <rect x="522" y="118" width="396" height="364" fill={`url(#sky${uid})`} />
        <g className="lineart" filter={pencil}>
          <Sky phase={phase} uid={uid} />
          <View view={view} />
        </g>
      </g>

      {/* the room: every opaque shape gets a colored-pencil outline (globals.css .lineart) */}
      <g className="lineart" filter={pencil}>
        <rect y="706" width="1440" height="16" fill={v("cream")} />
        {[770, 820, 870].map((y) => (
          <rect key={y} y={y} width="1440" height="2" fill={v("floor-d")} opacity="0.5" />
        ))}

        {/* window frame: a ring so the glass stays open */}
        <path
          d="M522 96h396a22 22 0 0 1 22 22v364a22 22 0 0 1-22 22H522a22 22 0 0 1-22-22V118a22 22 0 0 1 22-22Z M534 118a12 12 0 0 0-12 12v340a12 12 0 0 0 12 12h372a12 12 0 0 0 12-12V130a12 12 0 0 0-12-12Z"
          fillRule="evenodd"
          fill={v("white")}
        />
        <rect x="715" y="118" width="10" height="364" fill={v("white")} />
        <rect x="522" y="295" width="396" height="10" fill={v("white")} />
        <rect x="480" y="496" width="480" height="22" rx="10" fill={v("cream")} />
        {Art("window")}

        <rect x="100" y="330" width="300" height="16" rx="6" fill={v("wood")} />
        <path d="M140 346h22l-22 26Z M338 346h22v26Z" fill={v("wood-d")} />
        {Art("shelf")}

        {Art("wall")}
        {Art("lighting")}
        <FloorPlant />
        {Art("floor")}

        <rect x="250" y="676" width="28" height="224" fill={v("desk-d")} />
        <rect x="1162" y="676" width="28" height="224" fill={v("desk-d")} />
        <rect x="226" y="624" width="988" height="54" rx="6" fill={v("desk-d")} />
        <rect x="640" y="646" width="160" height="10" rx="5" fill={v("desk")} />
        <rect x="200" y="600" width="1040" height="28" rx="10" fill={v("desk")} />

        <rect x="610" y="584" width="190" height="16" rx="4" fill={v("lav")} />
        <rect x="622" y="570" width="170" height="14" rx="4" fill={v("cream")} />
        <rect x="866" y="548" width="7" height="44" rx="3" fill={v("yellow-d")} transform="rotate(-10 869 570)" />
        <rect x="880" y="540" width="7" height="50" rx="3" fill={v("blue-d")} transform="rotate(6 883 565)" />
        <rect x="854" y="560" width="46" height="40" rx="10" fill={v("mint")} />
        <ellipse cx="1100" cy="597" rx="46" ry="8" fill={v("mint-d")} />
        {/* lamp arm: a white tube with a pencil outline */}
        <path d="M1100 596 L1072 506 L1118 450" stroke="var(--line-art)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M1100 596 L1072 506 L1118 450" stroke={v("white")} strokeWidth="7.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M1092 414h52l26 58h-104Z" fill={v("mint")} />
        <ellipse cx="1118" cy="472" rx="20" ry="6" fill={v("yellow")} />
        {Art("desk")}
      </g>

      <LeafShadow />

      {/* light and shadow carry all the color (SPEC §4.3) */}
      <rect width="1440" height="900" mask={`url(#shade${uid})`} style={{ fill: "var(--shade)", opacity: "var(--shade-opacity)", mixBlendMode: "multiply" }} />
      {/* mask each layer, not a group: a masked group is isolated and would stop the blend modes reaching the room */}
      <path d={WINDOW_LIGHT} mask={`url(#light-mask${uid})`} fill={`url(#light${uid})`} style={{ opacity: "var(--light-wash)", mixBlendMode: "multiply" }} />
      <path d={WINDOW_LIGHT} mask={`url(#light-mask${uid})`} fill={`url(#light${uid})`} style={{ opacity: 0.85, mixBlendMode: "overlay" }} />

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
              fill={on ? "var(--ring)" : "transparent"}
              fillOpacity={on ? 0.18 : 0}
              stroke="var(--ring)"
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

/**
 * Outlines a shape built from overlapping primitives once around its silhouette:
 * a thick stroked copy underneath, the same shapes unstroked on top (globals.css .merge-*).
 */
function Merged({ children }: { children: ReactNode }) {
  return (
    <>
      <g className="merge-under">{children}</g>
      <g className="merge-top">{children}</g>
    </>
  );
}

/** Palm-leaf shadow cast across the lit floor by a plant just off the right edge. */
function LeafShadow() {
  const fronds = [
    { x: 1460, y: 880, a: 200, len: 300 },
    { x: 1470, y: 790, a: 188, len: 260 },
    { x: 1430, y: 960, a: 222, len: 250 },
  ];
  return (
    <g opacity="0.18" style={{ mixBlendMode: "multiply" }} aria-hidden>
      {fronds.map((f, i) => {
        const dir = (f.a * Math.PI) / 180;
        const tip = [f.x + Math.cos(dir) * f.len, f.y + Math.sin(dir) * f.len];
        return (
          <g key={i} style={{ fill: "var(--shade)" }}>
            <path d={`M${f.x} ${f.y} L${tip[0]} ${tip[1]}`} style={{ stroke: "var(--shade)" }} strokeWidth="4" strokeLinecap="round" />
            {Array.from({ length: 16 }, (_, k) => {
              const t = 0.1 + (k >> 1) * 0.11;
              const side = k % 2 ? 1 : -1;
              const len = 70 * (1 - t * 0.55);
              const leaf = dir + side * 0.95 - 0.35; // leaflets sweep toward the frond tip
              const bx = f.x + Math.cos(dir) * f.len * t;
              const by = f.y + Math.sin(dir) * f.len * t;
              const cx = bx + Math.cos(leaf) * len * 0.5;
              const cy = by + Math.sin(leaf) * len * 0.5;
              return <ellipse key={k} cx={cx} cy={cy} rx={len / 2} ry={7} transform={`rotate(${(leaf * 180) / Math.PI} ${cx} ${cy})`} />;
            })}
          </g>
        );
      })}
    </g>
  );
}

/** Tall leafy floor plant at the left wall: base decor, always present. */
function FloorPlant() {
  const leaves: [number, number, number][] = [
    [96, 560, -35],
    [150, 540, 30],
    [70, 640, -60],
    [168, 630, 55],
    [120, 600, 0],
  ];
  return (
    <g>
      <path
        d="M120 800 C118 720 112 660 100 590 M122 800 C128 720 140 660 150 560"
        stroke="var(--line-art)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {leaves.map(([x, y, a], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
          <path d="M0 -48 C30 -40 38 -6 0 40 C-38 -6 -30 -40 0 -48 Z" fill={v("green")} />
          <path d="M0 -40 L0 32" stroke="var(--line-art)" strokeWidth="1.5" fill="none" />
        </g>
      ))}
      <path d="M78 790h88l-10 92h-68Z" fill={v("cream")} />
      <rect x="72" y="782" width="100" height="16" rx="8" fill={v("peach")} />
    </g>
  );
}

const STARS: [number, number, number][] = [
  [560, 150, 2.5], [600, 250, 1.8], [690, 140, 2], [760, 210, 2.6], [820, 140, 1.6],
  [880, 230, 2.2], [650, 330, 1.6], [860, 330, 2], [560, 380, 1.4], [900, 170, 1.4],
];

/** Sun and moon are the light source, so the sun takes the phase's light color. */
function Sky({ phase, uid }: { phase: SkyPhase; uid: string }) {
  const stars = phase === "night" || phase === "predawn" || phase === "twilight";
  const sun = { fill: "var(--light)" };
  return (
    <g>
      {stars &&
        STARS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={v("white")} opacity={phase === "twilight" ? 0.5 : 0.9} />)}
      {phase === "night" && <circle cx="620" cy="190" r="30" fill={v("white")} mask={`url(#moon${uid})`} />}
      {phase === "dawn" && <circle cx="610" cy="430" r="40" style={sun} />}
      {phase === "morning" && <circle cx="620" cy="250" r="34" style={sun} />}
      {phase === "midday" && <circle cx="885" cy="230" r="28" style={sun} />}
      {phase === "afternoon" && <circle cx="600" cy="280" r="36" style={sun} />}
      {phase === "evening" && <circle cx="640" cy="390" r="54" style={sun} />}
      {phase === "twilight" && <ellipse cx="720" cy="470" rx="220" ry="40" fill={v("pink")} opacity="0.5" />}
      {phase !== "night" && phase !== "predawn" && (
        <Merged>
          <SkyCloud x={610} y={170} s={0.9} />
          <SkyCloud x={860} y={320} s={0.6} />
        </Merged>
      )}
    </g>
  );
}

const SkyCloud = ({ x, y, s }: { x: number; y: number; s: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={v("white")}>
    <circle cx="-30" cy="6" r="22" />
    <circle cx="4" cy="-8" r="30" />
    <circle cx="36" cy="8" r="20" />
    <rect x="-52" y="6" width="108" height="22" rx="11" />
  </g>
);

/** Rolling hills over a sea of clouds: the default view. */
function Hills() {
  return (
    <>
      <path d="M500 420 C580 360 660 360 740 404 C800 378 880 370 950 400 V500 H500 Z" fill={v("white")} />
      <path d="M500 452 C600 420 700 430 780 454 C840 440 900 440 950 452 V500 H500 Z" fill={v("cream")} />
      <CloudSea y={462} />
    </>
  );
}

function CloudSea({ y }: { y: number }) {
  return (
    <Merged>
      <g fill={v("white")}>
        {[530, 600, 680, 760, 840, 910].map((x, i) => (
          <circle key={x} cx={x} cy={y + (i % 2) * 8} r={28 + (i % 3) * 6} />
        ))}
        <rect x="500" y={y + 10} width="440" height="60" />
      </g>
    </Merged>
  );
}

function View({ view }: { view: WindowView }) {
  if (view === "garden") {
    return (
      <g>
        <Hills />
        <Merged>
          <g fill={v("white")}>
            <rect x="500" y="430" width="440" height="60" rx="20" />
            {[540, 600, 660, 760, 820, 880].map((x) => (
              <circle key={x} cx={x} cy={428} r={30} />
            ))}
          </g>
        </Merged>
        {[[560, 420], [640, 430], [790, 418], [870, 432], [700, 440]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="6" fill={v("cream")} />
        ))}
      </g>
    );
  }
  if (view === "sea") {
    return (
      <g>
        {/* the sea reflects the sky, so it takes the sky color, not a paint color */}
        <rect className="no-line" x="500" y="400" width="440" height="100" style={{ fill: "var(--sky-bottom)" }} />
        <path d="M500 400 H950" stroke="var(--line-art)" strokeWidth="2" />
        {[420, 445, 470].map((y, i) => (
          <path key={y} d={`M${540 + i * 40} ${y} h${120 - i * 20}`} stroke="var(--line-art)" strokeWidth="1.5" strokeLinecap="round" />
        ))}
        <path d="M590 404 L598 300 L622 300 L630 404Z" fill={v("white")} />
        <rect x="594" y="330" width="32" height="14" fill={v("pink-d")} />
        <rect x="592" y="368" width="36" height="14" fill={v("pink-d")} />
        <rect x="594" y="284" width="32" height="18" style={{ fill: "var(--light)" }} />
        <path d="M590 286 L610 264 L630 286Z" fill={v("white")} />
      </g>
    );
  }
  return <Hills />;
}
