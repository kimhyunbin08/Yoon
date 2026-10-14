"use client";
import { useId, type ComponentType } from "react";
import type { ItemId } from "../../../content/catalog";
import type { Glow } from "../items";
import { CalendarFace, INK, WallPattern, v } from "../shared";

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

function MoonCalendar() {
  // A row of moon phases above the date: new → full, drawn as outline + lit half.
  return (
    <g>
      <rect x="168" y="58" width="164" height="120" rx="8" fill={v("white")} />
      {[0, 1, 2, 3, 4].map((i) => {
        const cx = 192 + i * 29;
        const lit = [0, 0.35, 0.5, 0.75, 1][i];
        return (
          <g key={i}>
            <circle cx={cx} cy="76" r="9" fill={v("wall-d")} />
            {lit > 0 && <ellipse cx={cx + 9 * (1 - lit)} cy="76" rx={9 * lit} ry="9" fill={v("white")} />}
          </g>
        );
      })}
      <CalendarFace x={168} y={92} w={164} h={86} />
    </g>
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

function Hourglass() {
  return (
    <g>
      <rect x="676" y="512" width="64" height="10" rx="3" fill={v("wood")} />
      <rect x="676" y="590" width="64" height="10" rx="3" fill={v("wood")} />
      <path d="M684 522 V590 M732 522 V590" stroke={INK} strokeWidth="2.5" />
      <path d="M690 522 H726 Q726 548 710 556 Q726 564 726 590 H690 Q690 564 706 556 Q690 548 690 522 Z" fill={v("white")} />
      <path d="M696 584 Q708 568 720 584 Z" fill={v("wall-d")} />
      <path d="M708 556 V580" stroke={INK} strokeWidth="1" />
    </g>
  );
}

function TallCactus() {
  return (
    <g>
      <path d="M108 790 V560 Q108 534 124 534 Q140 534 140 560 V790 Z" fill={v("white")} />
      <path d="M108 680 H90 Q78 680 78 666 V620 Q78 608 88 608 Q98 608 98 620 V662 H108 Z" fill={v("white")} />
      <path d="M140 640 H158 Q170 640 170 626 V590 Q170 578 160 578 Q150 578 150 590 V622 H140 Z" fill={v("white")} />
      {[118, 130].map((x) => (
        <path key={x} d={`M${x} 548 V786`} stroke={INK} strokeWidth="1" opacity="0.4" />
      ))}
      <path d="M78 790h88l-10 92h-68Z" fill={v("cream")} />
      <rect x="72" y="782" width="100" height="16" rx="8" fill={v("white")} />
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
  "moon-calendar": MoonCalendar,
  "star-jars": StarJars,
  "library-desk": LibraryDesk,
  hourglass: Hourglass,
  "tall-cactus": TallCactus,
  "floor-books": FloorBooks,
};

export const STARRY_GLOWS: Partial<Record<string, Glow[]>> = {};
