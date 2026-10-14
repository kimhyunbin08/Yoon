"use client";
import { useId, type ComponentType } from "react";
import type { ItemId } from "../../../content/catalog";
import type { Glow } from "../items";
import { CalendarFace, INK, Tube, WallPattern, v } from "../shared";

// 햇살 카페 (sunny-cafe): stripes, brass, and coffee. Pre-v5 items (latte & cake, pendant, menu board) live in items.tsx.

function CafeWallpaper() {
  const id = `stripe${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <WallPattern id={id} size={64}>
      <g stroke={INK} strokeWidth="1.2" opacity="0.2">
        <path d="M8 0 V64" />
        <path d="M18 0 V64" />
      </g>
    </WallPattern>
  );
}

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

function MokaPot() {
  return (
    <g>
      <path d="M676 600 L666 556 H730 L720 600 Z" fill={v("white")} />
      <rect x="664" y="550" width="68" height="8" rx="2" fill={v("white")} />
      <path d="M672 550 L680 510 H716 L724 550 Z" fill={v("white")} />
      <path d="M680 510 L698 492 L716 510 Z" fill={v("white")} />
      <circle cx="698" cy="488" r="5" fill={v("white")} />
      <Tube d="M724 520 Q754 524 744 556" width={6} />
      <path d="M672 520 L654 512" stroke={INK} strokeWidth="2" fill="none" />
      <path d="M772 600 Q770 574 772 572 H812 Q814 574 812 600 Z" fill={v("white")} />
      <Tube d="M812 580 Q826 582 812 594" width={4} />
      <ellipse cx="792" cy="600" rx="30" ry="5" fill={v("white")} />
    </g>
  );
}

function OliveTree() {
  const clusters: [number, number][] = [[96, 560], [146, 540], [120, 520], [76, 610], [166, 600], [122, 590]];
  return (
    <g>
      <path d="M122 782 Q116 700 124 640 Q128 600 120 560" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M122 782 Q116 700 124 640 Q128 600 120 560" stroke={v("white")} strokeWidth="2" fill="none" strokeLinecap="round" />
      {clusters.flatMap(([x, y], i) =>
        [-40, 0, 40, 80].map((a, k) => (
          <ellipse key={`${i}-${k}`} cx={x + Math.cos((a * Math.PI) / 180) * 16} cy={y + Math.sin((a * Math.PI) / 180) * 10} rx="12" ry="4.5" transform={`rotate(${a + i * 15} ${x} ${y})`} fill={v("white")} />
        )),
      )}
      <path d="M82 790h80l-8 92h-64Z" fill={v("white")} />
      <rect x="76" y="782" width="92" height="14" rx="7" fill={v("cream")} />
    </g>
  );
}

function CheckerRug() {
  const id = `check${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <g>
      <defs>
        <pattern id={id} width="48" height="24" patternUnits="userSpaceOnUse">
          <rect className="no-line" width="24" height="12" fill={v("wall-d")} />
          <rect className="no-line" x="24" y="12" width="24" height="12" fill={v("wall-d")} />
        </pattern>
      </defs>
      <path d="M330 790 H1110 L1170 880 H270 Z" fill={v("white")} />
      <path className="no-line" d="M346 798 H1094 L1144 872 H296 Z" fill={`url(#${id})`} />
    </g>
  );
}

export const CAFE_ART: Partial<Record<ItemId, ComponentType>> = {
  "cafe-wallpaper": CafeWallpaper,
  "cafe-curtain": CafeCurtain,
  "tearoff-calendar": TearoffCalendar,
  "coffee-jars": CoffeeJars,
  "cafe-table": CafeTable,
  "moka-pot": MokaPot,
  "olive-tree": OliveTree,
  "checker-rug": CheckerRug,
};

export const CAFE_GLOWS: Partial<Record<string, Glow[]>> = {};
