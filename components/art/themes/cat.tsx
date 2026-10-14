"use client";
import { useId, type ComponentType } from "react";
import type { ItemId } from "../../../content/catalog";
import type { Glow } from "../items";
import { CalendarFace, INK, Tube, WallPattern, v } from "../shared";

// 노을 고양이 (sunset-cat): dots, paws, and yarn. Pre-v5 items (sleeping cat, poster, books) live in items.tsx.

function DotWallpaper() {
  const id = `dot${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <WallPattern id={id} size={56}>
      <g stroke={INK} strokeWidth="1.2" fill="none" opacity="0.24">
        <circle cx="14" cy="14" r="4" />
        <circle cx="42" cy="42" r="4" />
      </g>
    </WallPattern>
  );
}

function RollerShade() {
  return (
    <g>
      <rect x="512" y="98" width="416" height="16" rx="8" fill={v("wood")} />
      <rect x="524" y="114" width="392" height="150" fill={v("white")} />
      <rect x="520" y="262" width="400" height="10" rx="5" fill={v("wood-d")} />
      <path d="M720 272 V300" stroke={INK} strokeWidth="1.5" />
      <circle cx="720" cy="306" r="7" fill={v("white")} />
      <path d="M560 150 H880 M560 190 H880 M560 230 H880" stroke={INK} strokeWidth="1" opacity="0.25" />
    </g>
  );
}

function WallSconce() {
  return (
    <g>
      <rect x="994" y="232" width="22" height="40" rx="6" fill={v("white")} />
      <Tube d="M1005 252 Q1030 246 1034 222" width={4} />
      <path d="M1012 222 L1056 222 L1046 190 L1022 190 Z" fill={v("white")} />
      <ellipse cx="1034" cy="226" rx="10" ry="4" fill={v("yellow")} />
    </g>
  );
}

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

function YarnBasket() {
  return (
    <g>
      <path d="M326 600 L314 556 H458 L446 600 Z" fill={v("white")} />
      {[566, 578, 590].map((y) => (
        <path key={y} d={`M318 ${y} H454`} stroke={INK} strokeWidth="1" opacity="0.5" />
      ))}
      {[350, 386, 422].map((x) => (
        <path key={x} d={`M${x} 556 V600`} stroke={INK} strokeWidth="1" opacity="0.5" />
      ))}
      <circle cx="360" cy="542" r="22" fill={v("white")} />
      <circle cx="408" cy="536" r="26" fill={v("white")} />
      <path d="M344 534 Q362 528 378 546 M392 520 Q412 530 426 554 M386 540 Q404 536 420 520" stroke={INK} strokeWidth="1.2" fill="none" />
      <path d="M430 520 L486 474 M438 526 L496 486" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M440 590 Q500 600 520 586" stroke={INK} strokeWidth="1.4" fill="none" />
    </g>
  );
}

function FishMug() {
  return (
    <g>
      <path d="M676 600 V546 Q676 540 682 540 H742 Q748 540 748 546 V600 Z" fill={v("white")} />
      {/* fish-shaped handle */}
      <path d="M748 552 Q776 546 782 566 Q776 586 748 582 Z" fill={v("white")} />
      <path d="M782 566 L796 554 V578 Z" fill={v("white")} />
      <circle cx="764" cy="562" r="2" fill={v("ink")} />
      <path d="M690 564 Q712 556 734 564" stroke={INK} strokeWidth="1.2" fill="none" />
      <rect x="612" y="586" width="46" height="14" rx="2" fill={v("white")} transform="rotate(-4 635 593)" />
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

export const CAT_ART: Partial<Record<ItemId, ComponentType>> = {
  "dot-wallpaper": DotWallpaper,
  "roller-shade": RollerShade,
  "wall-sconce": WallSconce,
  "cat-calendar": CatCalendar,
  "paw-desk": PawDesk,
  "yarn-basket": YarnBasket,
  "fish-mug": FishMug,
  "cat-grass": CatGrass,
};

export const CAT_GLOWS: Partial<Record<string, Glow[]>> = {
  "wall-sconce": [{ cx: 1034, cy: 210, r: 200 }],
};
