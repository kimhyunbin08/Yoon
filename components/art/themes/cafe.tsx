"use client";
import type { ComponentType } from "react";
import type { ItemId } from "../../../content/catalog";
import type { Glow } from "../items";
import { CalendarFace, INK, Tube, v } from "../shared";

// 햇살 카페 (sunny-cafe): stripes, brass, and coffee. Pre-v5 items (latte & cake, pendant, menu board) live in items.tsx.

function CafeCurtain() {
  // A café half-curtain on a rod across the middle of the glass.
  const scallops = Array.from({ length: 10 }, () => "q19.6 16 39.2 0").join(" ");
  return (
    <g>
      <rect x="496" y="296" width="448" height="8" rx="4" fill={v("wood-d")} />
      {Array.from({ length: 11 }, (_, i) => (
        <circle key={i} cx={524 + i * 39.2} cy="304" r="5" fill={v("white")} />
      ))}
      <path d={`M522 306 V456 ${scallops} V306 Z`} fill={v("white")} />
      {[600, 680, 760, 840].map((x) => (
        <path key={x} d={`M${x} 312 V446`} stroke={INK} strokeWidth="1" opacity="0.4" />
      ))}
    </g>
  );
}

function TearoffCalendar() {
  return (
    <g>
      <rect x="190" y="66" width="120" height="110" rx="6" fill={v("white")} />
      <rect x="190" y="66" width="120" height="24" rx="6" fill={v("wood")} />
      {[214, 250, 286].map((cx) => (
        <rect key={cx} x={cx - 3} y="58" width="6" height="16" rx="3" fill={v("white")} />
      ))}
      <path d="M196 176 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5" stroke={INK} strokeWidth="1" fill="none" />
      <CalendarFace x={190} y={90} w={120} h={84} />
    </g>
  );
}

function CoffeeJars() {
  const jars: [number, number, number][] = [[120, 70, 66], [204, 62, 82], [284, 76, 58]];
  return (
    <g>
      {jars.map(([x, w, h], i) => (
        <g key={x}>
          <rect x={x + 6} y={330 - h - 12} width={w - 12} height="14" rx="4" fill={v("wood")} />
          <rect x={x} y={330 - h} width={w} height={h} rx="10" fill={v("white")} />
          <rect x={x + 10} y={330 - h * 0.62} width={w - 20} height={h * 0.36} rx="3" fill={v("cream")} />
          {Array.from({ length: 4 + i }, (_, k) => (
            <ellipse key={k} cx={x + 14 + ((k * 13) % (w - 24))} cy={322 - (k % 3) * 6} rx="4" ry="2.6" fill={v("wall-d")} />
          ))}
        </g>
      ))}
    </g>
  );
}

function CafeTable() {
  return (
    <g>
      {[392, 1048].map((x) => (
        <g key={x}>
          <rect x={x - 12} y="628" width="24" height="250" fill={v("desk-d")} />
          <path d={`M${x - 70} 900 Q${x} 860 ${x + 70} 900 Z`} fill={v("desk-d")} />
        </g>
      ))}
      <rect x="226" y="624" width="988" height="22" rx="4" fill={v("desk-d")} />
      <rect x="200" y="600" width="1040" height="28" rx="14" fill={v("desk")} />
      <path d="M260 612 Q420 606 520 616 M820 608 Q980 618 1160 610" stroke={INK} strokeWidth="1" fill="none" opacity="0.35" />
    </g>
  );
}

/** Banker's lamp: brass stem, half-cylinder shade, pull chain. */
function BankerLamp() {
  return (
    <g>
      <rect x="1056" y="586" width="98" height="14" rx="6" fill={v("wood")} />
      <Tube d="M1105 588 V530" width={6} />
      <path d="M1036 532 Q1036 498 1105 496 Q1174 498 1174 532 Z" fill={v("white")} />
      <rect x="1034" y="530" width="142" height="8" rx="4" fill={v("wood")} />
      <path d="M1150 538 V566" stroke={INK} strokeWidth="1.2" strokeDasharray="2 3" />
      <circle cx="1150" cy="569" r="3" fill={v("white")} />
    </g>
  );
}

export const CAFE_ART: Partial<Record<ItemId, ComponentType>> = {
  "banker-lamp": BankerLamp,
  "cafe-curtain": CafeCurtain,
  "tearoff-calendar": TearoffCalendar,
  "coffee-jars": CoffeeJars,
  "cafe-table": CafeTable,
};

export const CAFE_GLOWS: Partial<Record<string, Glow[]>> = {
  "banker-lamp": [{ cx: 1105, cy: 560, r: 260 }],
};
