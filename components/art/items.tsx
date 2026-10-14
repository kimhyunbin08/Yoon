"use client";
import { useEffect, useState, type ComponentType } from "react";
import type { ItemId } from "../../content/catalog";
import { CAFE_ART } from "./themes/cafe";
import { CAT_ART } from "./themes/cat";
import { GARDEN_ART } from "./themes/garden";
import { STARRY_ART } from "./themes/starry";
import { v } from "./shared";

// Original room item art in 1440x900 stage coordinates. Each item draws itself inside its slot (Room SLOT_RECTS).

function Curtains({ fill, tie }: { fill: string; tie: string }) {
  return (
    <g>
      <rect x="466" y="74" width="508" height="10" rx="5" fill={v("wood-d")} />
      <path d="M476 80H568C562 200 542 300 564 382C542 420 526 470 514 528H476Z" fill={fill} />
      <path d="M964 80H872C878 200 898 300 876 382C898 420 914 470 926 528H964Z" fill={fill} />
      <rect x="524" y="374" width="48" height="14" rx="7" fill={tie} />
      <rect x="868" y="374" width="48" height="14" rx="7" fill={tie} />
    </g>
  );
}

function GardenWindow() {
  return (
    <g opacity="0.92">
      <Curtains fill={v("white")} tie={v("mint-d")} />
    </g>
  );
}

function SeaWindow() {
  return <Curtains fill={v("lav")} tie={v("yellow-d")} />;
}

function GardenPlants() {
  return (
    <g>
      {/* trailing ivy */}
      <path d="M210 346c-6 40 10 70 -4 110" stroke={v("green-d")} strokeWidth="4" fill="none" strokeLinecap="round" />
      {[370, 395, 420, 445].map((y, i) => (
        <ellipse key={y} cx={i % 2 ? 214 : 200} cy={y} rx="10" ry="6" fill={v("green")} transform={`rotate(${i % 2 ? 30 : -30} ${i % 2 ? 214 : 200} ${y})`} />
      ))}
      {/* pot 1: leafy */}
      <ellipse cx="150" cy="262" rx="26" ry="20" fill={v("green")} />
      <ellipse cx="170" cy="250" rx="20" ry="16" fill={v("green-d")} />
      <path d="M126 280h52l-6 50h-40Z" fill={v("pink")} />
      <rect x="122" y="276" width="60" height="10" rx="5" fill={v("pink-d")} />
      {/* pot 2: tall leaves */}
      <path d="M244 280c-6-40 0-70 8-84 4 30 2 60-2 84Z" fill={v("green-d")} />
      <path d="M256 280c2-34 10-56 22-66-2 26-8 48-14 66Z" fill={v("green")} />
      <path d="M232 280h50l-5 50h-40Z" fill={v("mint")} />
      <rect x="228" y="276" width="58" height="10" rx="5" fill={v("mint-d")} />
      {/* pot 3: round succulent */}
      <circle cx="342" cy="282" r="18" fill={v("green")} />
      <circle cx="334" cy="276" r="7" fill={v("green-d")} />
      <circle cx="352" cy="286" r="6" fill={v("green-d")} />
      <path d="M318 296h48l-5 34h-38Z" fill={v("peach")} />
    </g>
  );
}

function BookShelf() {
  const books: [number, number, string][] = [
    [118, 92, "lav"], [140, 78, "pink"], [160, 100, "blue"], [184, 84, "peach"], [206, 70, "mint"],
  ];
  return (
    <g>
      {books.map(([x, h, c]) => (
        <g key={x}>
          <rect x={x} y={330 - h} width="20" height={h} rx="3" fill={v(c)} />
          <rect x={x + 4} y={330 - h + 12} width="12" height="4" rx="2" fill={v("cream")} opacity="0.8" />
        </g>
      ))}
      <rect x="236" y="250" width="20" height="82" rx="3" fill={v("lav-d")} transform="rotate(14 246 330)" />
      {/* cactus */}
      <rect x="326" y="252" width="22" height="50" rx="11" fill={v("green")} />
      <path d="M326 278h-8a8 8 0 0 1-8-8v-8" stroke={v("green")} strokeWidth="9" strokeLinecap="round" fill="none" />
      <circle cx="337" cy="250" r="5" fill={v("pink")} />
      <path d="M314 300h46l-5 30h-36Z" fill={v("cream")} />
    </g>
  );
}

function GardenRug() {
  return (
    <g>
      <ellipse cx="720" cy="832" rx="560" ry="58" fill={v("mint")} />
      <ellipse cx="720" cy="832" rx="500" ry="42" fill="none" stroke={v("cream")} strokeWidth="6" strokeDasharray="2 16" strokeLinecap="round" />
    </g>
  );
}

function CatCushion() {
  return (
    <g>
      <ellipse cx="1320" cy="858" rx="104" ry="26" fill={v("peach-d")} />
      <ellipse cx="1320" cy="846" rx="96" ry="24" fill={v("peach")} />
      <path d="M1378 832c34 4 40-28 22-36" stroke={v("cat")} strokeWidth="14" strokeLinecap="round" fill="none" />
      <ellipse cx="1330" cy="812" rx="64" ry="38" fill={v("cat")} />
      <path d="M1320 780c4 10 4 20 0 30M1340 778c4 10 4 22 0 32" stroke={v("peach-d")} strokeWidth="5" strokeLinecap="round" />
      <circle cx="1276" cy="800" r="30" fill={v("cat")} />
      <path d="M1252 784l2-28 20 16Z M1300 784l-2-28-20 16Z" fill={v("cat")} />
      <path d="M1257 778l2-14 9 8Z" fill={v("pink")} />
      <path d="M1264 802c3 3 7 3 10 0M1282 802c3 3 7 3 10 0" stroke={v("ink")} strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="1278" cy="810" rx="3" ry="2" fill={v("pink-d")} />
      <circle cx="1262" cy="812" r="5" fill={v("pink")} opacity="0.6" />
      <circle cx="1294" cy="812" r="5" fill={v("pink")} opacity="0.6" />
      <circle cx="1294" cy="828" r="7" fill={v("yellow-d")} />
    </g>
  );
}

function LatteCake() {
  return (
    <g>
      <path className="anim-steam" d="M350 520c-6-8 6-12 0-20M372 520c-6-8 6-12 0-20" stroke={v("white")} strokeWidth="4" strokeLinecap="round" fill="none" />
      <ellipse cx="364" cy="600" rx="58" ry="8" fill={v("cream")} />
      <path d="M326 536h76v40a20 20 0 0 1-20 20h-36a20 20 0 0 1-20-20Z" fill={v("white")} />
      <path d="M402 548h6a14 14 0 0 1 0 28h-6" stroke={v("white")} strokeWidth="9" fill="none" />
      <ellipse cx="364" cy="538" rx="36" ry="6" fill={v("wood")} />
      <path d="M364 542c-6-4-8-6-6-8 2-1 4 0 6 2 2-2 4-3 6-2 2 2 0 4-6 8Z" fill={v("cream")} />
      <ellipse cx="478" cy="600" rx="54" ry="7" fill={v("white")} />
      <path d="M440 560h76v36h-76Z" fill={v("cream")} />
      <rect x="440" y="572" width="76" height="8" fill={v("pink")} />
      <rect x="440" y="552" width="76" height="12" rx="6" fill={v("pink")} />
      <path d="M478 540c8 0 12 6 12 12h-24c0-6 4-12 12-12Z" fill={v("coral")} />
      <rect x="476" y="534" width="4" height="8" rx="2" fill={v("green-d")} />
    </g>
  );
}

function CandleBooks() {
  return (
    <g>
      <rect x="300" y="576" width="210" height="24" rx="4" fill={v("lav")} />
      <rect x="316" y="554" width="176" height="22" rx="4" fill={v("blue")} />
      <rect x="332" y="534" width="146" height="20" rx="4" fill={v("pink")} />
      <rect x="300" y="584" width="210" height="4" fill={v("cream")} opacity="0.7" />
      <rect x="382" y="478" width="36" height="56" rx="6" fill={v("cream")} />
      <path d="M388 478v12" stroke={v("white")} strokeWidth="5" strokeLinecap="round" />
      <path className="anim-flicker" d="M400 438c10 12 10 24 0 30-10-6-10-18 0-30Z" fill={v("yellow-d")} />
      <path d="M400 452c4 6 4 10 0 14-4-4-4-8 0-14Z" fill={v("cream")} />
    </g>
  );
}

function PendantLamp() {
  return (
    <g>
      <rect x="998" y="0" width="4" height="176" fill={v("ink")} opacity="0.5" />
      <path d="M950 222c0-30 22-50 50-50s50 20 50 50Z" fill={v("peach")} />
      <rect x="946" y="218" width="108" height="8" rx="4" fill={v("peach-d")} />
      <circle cx="1000" cy="234" r="12" fill={v("yellow")} />
    </g>
  );
}

const swag = (p0: number[], c: number[], p1: number[], t: number) =>
  [0, 1].map((k) => (1 - t) ** 2 * p0[k] + 2 * (1 - t) * t * c[k] + t ** 2 * p1[k]);
const GARLAND = [
  ...[0.12, 0.3, 0.5, 0.7, 0.88].map((t) => swag([40, 26], [380, 120], [720, 36], t)),
  ...[0.12, 0.3, 0.5, 0.7, 0.88].map((t) => swag([720, 36], [1060, 120], [1400, 26], t)),
];

function StarGarland() {
  return (
    <g>
      <path d="M40 26Q380 120 720 36Q1060 120 1400 26" stroke={v("ink")} strokeWidth="2.5" fill="none" opacity="0.45" />
      {GARLAND.map(([x, y], i) => (
        <path
          key={i}
          transform={`translate(${x - 14} ${y - 4}) scale(0.45)`}
          d="M32 6l7.6 16.4 17.9 2-13.3 12.2 3.8 17.6L32 45.2 16 54.2l3.8-17.6L6.5 24.4l17.9-2Z"
          fill={i % 3 === 0 ? v("pink") : v("yellow")}
        />
      ))}
    </g>
  );
}

function MenuBoard() {
  return (
    <g>
      <path d="M1140 186L1200 150 1260 186" stroke={v("ink")} strokeWidth="3" fill="none" opacity="0.5" />
      <circle cx="1200" cy="150" r="6" fill={v("wood-d")} />
      <rect x="1090" y="180" width="220" height="250" rx="16" fill={v("wood")} />
      <rect x="1104" y="194" width="192" height="222" rx="10" fill={v("mint-d")} />
      <path d="M1180 222h40v22a14 14 0 0 1-14 14h-12a14 14 0 0 1-14-14Z" fill={v("cream")} />
      <path d="M1220 228h4a8 8 0 0 1 0 16h-4" stroke={v("cream")} strokeWidth="4" fill="none" />
      {[280, 312, 344, 376].map((y, i) => (
        <g key={y}>
          <rect x="1124" y={y} width={[96, 72, 104, 64][i]} height="10" rx="5" fill={v("cream")} opacity="0.9" />
          <rect x="1252" y={y} width="26" height="10" rx="5" fill={v("yellow")} />
        </g>
      ))}
    </g>
  );
}

function SunsetPoster() {
  return (
    <g>
      <rect x="1098" y="176" width="204" height="270" rx="8" fill={v("white")} />
      <rect x="1112" y="190" width="176" height="200" fill={v("peach")} />
      <rect x="1112" y="190" width="176" height="80" fill={v("pink")} />
      <circle cx="1200" cy="320" r="44" fill={v("coral")} />
      <path d="M1112 350c40-24 70-24 100 0s56 20 76 4V390H1112Z" fill={v("lav-d")} />
      <path d="M1112 370c50-20 90-10 176 0V390H1112Z" fill={v("lav")} />
      <rect x="1140" y="406" width="120" height="10" rx="5" fill={v("wall-d")} />
      <rect x="1166" y="424" width="68" height="8" rx="4" fill={v("wall-d")} />
    </g>
  );
}

export function ClockHands({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const m = now.getMinutes();
  const h = (now.getHours() % 12) + m / 60;
  return (
    <g stroke={v("ink")} strokeLinecap="round">
      <line x1={cx} y1={cy} x2={cx} y2={cy - r * 0.5} strokeWidth="8" transform={`rotate(${h * 30} ${cx} ${cy})`} />
      <line x1={cx} y1={cy} x2={cx} y2={cy - r * 0.75} strokeWidth="5" transform={`rotate(${m * 6} ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r="7" fill={v("ink")} stroke="none" />
    </g>
  );
}

function MoonClock() {
  const [cx, cy, r] = [1205, 300, 96];
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 14} fill={v("lav-d")} />
      <circle cx={cx} cy={cy} r={r} fill={v("cream")} />
      <path d="M1188 240a40 40 0 1 0 50 50 34 34 0 0 1-50-50Z" fill={v("yellow")} opacity="0.85" />
      {Array.from({ length: 12 }, (_, i) => (
        <circle key={i} cx={cx + Math.sin((i * Math.PI) / 6) * (r - 14)} cy={cy - Math.cos((i * Math.PI) / 6) * (r - 14)} r={i % 3 ? 3 : 5} fill={v("lav-d")} />
      ))}
      <ClockHands cx={cx} cy={cy} r={r} />
    </g>
  );
}

// Window views are drawn by Room from the windowView item's `view`, so they have no component here.
export const ITEM_ART: Partial<Record<ItemId, ComponentType>> = {
  ...GARDEN_ART,
  ...CAFE_ART,
  ...CAT_ART,
  ...STARRY_ART,
  "garden-window": GardenWindow,
  "garden-plants": GardenPlants,
  "garden-rug": GardenRug,
  "latte-cake": LatteCake,
  "pendant-lamp": PendantLamp,
  "menu-board": MenuBoard,
  "cat-cushion": CatCushion,
  "sunset-poster": SunsetPoster,
  "book-shelf": BookShelf,
  "sea-window": SeaWindow,
  "star-garland": StarGarland,
  "candle-books": CandleBooks,
  "moon-clock": MoonClock,
};

