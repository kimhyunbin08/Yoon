"use client";
import { useId, type ComponentType } from "react";
import type { ItemId } from "../../../content/catalog";
import { INK, WallPattern, v } from "../shared";

// 별밤 도서관 (starry-library): stars, jars, and old wood. Pre-v5 items (curtains, garland, candle & books, moon clock) live in items.tsx.

const sparkle = (x: number, y: number, r: number) => `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;

function StarWallpaper() {
  const id = `star${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <WallPattern id={id} size={88}>
      <g stroke={INK} strokeWidth="1.1" fill="none" opacity="0.24">
        <path d={sparkle(20, 22, 7)} />
        <path d={sparkle(64, 60, 5)} />
        <circle cx="62" cy="18" r="1.6" />
        <circle cx="24" cy="70" r="1.6" />
      </g>
    </WallPattern>
  );
}

function StarJars() {
  const jars: [number, number, number][] = [[118, 64, 70], [196, 74, 88], [284, 60, 62]];
  return (
    <g>
      {jars.map(([x, w, h], i) => (
        <g key={x}>
          <rect x={x + w / 2 - 12} y={330 - h - 14} width="24" height="16" rx="3" fill={v("wood")} />
          <path d={`M${x + 8} ${330 - h} H${x + w - 8} Q${x + w} ${330 - h + 10} ${x + w} ${330 - h + 24} V320 Q${x + w} 330 ${x + w - 10} 330 H${x + 10} Q${x} 330 ${x} 320 V${330 - h + 24} Q${x} ${330 - h + 10} ${x + 8} ${330 - h} Z`} fill={v("white")} />
          {Array.from({ length: 3 + i }, (_, k) => (
            <path key={k} d={sparkle(x + 16 + ((k * 17) % (w - 28)), 330 - 14 - ((k * 23) % (h - 30)), 5)} fill={v("white")} />
          ))}
        </g>
      ))}
    </g>
  );
}

function LibraryDesk() {
  return (
    <g>
      {[220, 1020].map((x) => (
        <g key={x}>
          <rect x={x} y="628" width="200" height="272" fill={v("desk-d")} />
          {[648, 732, 816].map((y) => (
            <g key={y}>
              <rect x={x + 14} y={y} width="172" height="70" rx="4" fill={v("desk")} />
              <rect x={x + 84} y={y + 30} width="32" height="8" rx="4" fill={v("white")} />
            </g>
          ))}
        </g>
      ))}
      <rect x="420" y="628" width="600" height="40" fill={v("desk-d")} />
      <rect x="196" y="596" width="1048" height="32" rx="6" fill={v("desk")} />
      <path d="M210 606 H1230" stroke={INK} strokeWidth="1" opacity="0.4" />
    </g>
  );
}

function FloorBooks() {
  const stack: [number, number, number][] = [[1236, 868, 160], [1246, 846, 140], [1240, 826, 150], [1256, 808, 118]];
  return (
    <g>
      {stack.map(([x, y, w], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={i === 0 ? 24 : 20} rx="3" fill={v("white")} />
          <path d={`M${x + 10} ${y + 6} H${x + w - 10}`} stroke={INK} strokeWidth="1" opacity="0.4" />
        </g>
      ))}
      <path d="M1290 806 L1310 778 H1360 L1352 806 Z M1352 806 L1360 778 H1406 L1420 806 Z" fill={v("white")} />
    </g>
  );
}

export const STARRY_ART: Partial<Record<ItemId, ComponentType>> = {
  "star-wallpaper": StarWallpaper,
  "star-jars": StarJars,
  "library-desk": LibraryDesk,
  "floor-books": FloorBooks,
};
