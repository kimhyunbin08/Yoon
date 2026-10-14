"use client";
import type { ComponentType } from "react";
import type { ItemId } from "../../../content/catalog";
import { CalendarFace, INK, Tube, v } from "../shared";

// 노을 고양이 (sunset-cat): dots, paws, and yarn. Pre-v5 items (sleeping cat, poster, books) live in items.tsx.

function CatCalendar() {
  return (
    <g>
      <path d="M180 74 L196 40 L214 70 Z M286 70 L304 40 L320 74 Z" fill={v("white")} />
      <path d="M190 64 L198 50 L206 64 Z M294 64 L302 50 L310 64 Z" fill={v("pink-d")} />
      <rect x="175" y="64" width="150" height="112" rx="18" fill={v("white")} />
      <path d="M238 92 q3 3 6 0 M256 92 q3 3 6 0" stroke={INK} strokeWidth="1.4" fill="none" />
      <CalendarFace x={175} y={92} w={150} h={84} />
    </g>
  );
}

function PawDesk() {
  return (
    <g>
      {/* rounded legs ending in paws */}
      {[256, 1176].map((x) => (
        <g key={x}>
          <rect x={x - 14} y="640" width="28" height="244" rx="12" fill={v("desk-d")} />
          <ellipse cx={x} cy="888" rx="22" ry="12" fill={v("white")} />
          <path d={`M${x - 8} 882 V894 M${x} 880 V896 M${x + 8} 882 V894`} stroke={INK} strokeWidth="1" />
        </g>
      ))}
      <rect x="226" y="624" width="988" height="58" rx="10" fill={v("desk-d")} />
      {[480, 960].map((cx) => (
        <g key={cx}>
          <rect x={cx - 110} y="634" width="220" height="38" rx="8" fill={v("desk")} />
          <circle cx={cx} cy="656" r="9" fill={v("white")} />
          {[-10, -3.5, 3.5, 10].map((dx, i) => (
            <circle key={dx} cx={cx + dx} cy={i === 0 || i === 3 ? 643 : 640} r="3" fill={v("white")} />
          ))}
        </g>
      ))}
      <rect x="200" y="600" width="1040" height="28" rx="14" fill={v("desk")} />
    </g>
  );
}

function CatGrass() {
  const blades = Array.from({ length: 22 }, (_, i) => {
    const x = 92 + i * 3.4;
    const lean = ((i % 5) - 2) * 7;
    return `M${x} 812 Q${x + lean * 0.4} ${770 - (i % 4) * 10} ${x + lean} ${744 - (i % 3) * 14}`;
  });
  return (
    <g>
      {blades.map((d, i) => (
        <path key={i} d={d} stroke={INK} strokeWidth="1.4" fill="none" />
      ))}
      <path d="M80 812 H180 L168 880 H92 Z" fill={v("white")} />
      <rect x="74" y="806" width="112" height="14" rx="7" fill={v("cream")} />
      {/* a toy mouse waiting for the cat */}
      <ellipse cx="226" cy="872" rx="20" ry="11" fill={v("white")} />
      <circle cx="210" cy="864" r="5" fill={v("white")} />
      <path d="M246 874 Q262 868 270 880" stroke={INK} strokeWidth="1.4" fill="none" />
    </g>
  );
}

/** Desk lamp with a cat-ear shade. */
function CatLamp() {
  return (
    <g>
      <ellipse cx="1105" cy="594" rx="40" ry="8" fill={v("white")} />
      <Tube d="M1105 590 Q1096 540 1110 504" width={6} />
      <path d="M1066 506 L1074 466 L1090 480 Q1110 472 1130 480 L1146 466 L1154 506 Z" fill={v("white")} />
      <path d="M1076 476 L1080 462 L1088 472 Z M1134 472 L1142 462 L1146 476 Z" fill={v("pink-d")} />
      <path d="M1098 494 q4 4 8 0 M1114 494 q4 4 8 0" stroke={INK} strokeWidth="1.3" fill="none" />
    </g>
  );
}

export const CAT_ART: Partial<Record<ItemId, ComponentType>> = {
  "cat-lamp": CatLamp,
  "cat-calendar": CatCalendar,
  "paw-desk": PawDesk,
  "cat-grass": CatGrass,
};
