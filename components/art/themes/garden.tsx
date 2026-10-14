"use client";
import type { ComponentType } from "react";
import type { ItemId } from "../../../content/catalog";
import type { Glow } from "../items";
import { CalendarFace, INK, Tube, v } from "../shared";

// 새벽 정원 (dawn-garden): leaves, paper, and watering. Pre-v5 items (curtains, plant shelf, rug) live in items.tsx.

function PaperLantern() {
  return (
    <g>
      <path d="M1000 0 V136" stroke={INK} strokeWidth="2" />
      <rect x="984" y="134" width="32" height="12" rx="3" fill={v("white")} />
      <ellipse cx="1000" cy="196" rx="44" ry="52" fill={v("white")} />
      {[-26, -10, 10, 26].map((dx) => (
        <path key={dx} d={`M${1000 + dx} 148 Q${1000 + dx * 1.7} 196 ${1000 + dx} 244`} stroke={INK} strokeWidth="1.2" fill="none" />
      ))}
      <rect x="986" y="244" width="28" height="10" rx="3" fill={v("white")} />
    </g>
  );
}

function FlowerCalendar() {
  return (
    <g>
      <path d="M250 44 L222 66 M250 44 L278 66" stroke={INK} strokeWidth="1.6" fill="none" />
      <circle cx="250" cy="44" r="4" fill={v("white")} />
      <rect x="175" y="64" width="150" height="112" rx="6" fill={v("white")} />
      <rect x="175" y="64" width="150" height="22" rx="6" fill={v("cream")} />
      {[206, 250, 294].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="75" r="6" fill={v("white")} />
          <circle cx={cx} cy="75" r="2" fill={v("wall-d")} />
        </g>
      ))}
      <CalendarFace x={175} y={86} w={150} h={90} />
    </g>
  );
}

function WateringCan() {
  return (
    <g>
      <Tube d="M352 540 Q396 486 440 540" width={6} />
      <path d="M440 568 L500 520 L506 528 L452 584 Z" fill={v("white")} />
      <ellipse cx="503" cy="522" rx="10" ry="14" transform="rotate(-40 503 522)" fill={v("white")} />
      <path d="M330 552 Q330 540 342 540 H438 Q450 540 450 552 V592 Q450 600 442 600 H338 Q330 600 330 592 Z" fill={v("white")} />
      <path d="M340 566 H440" stroke={INK} strokeWidth="1.2" fill="none" />
    </g>
  );
}

function FlowerNotebook() {
  return (
    <g>
      <path d="M612 600 L630 566 H718 L716 600 Z" fill={v("white")} />
      <path d="M716 600 L718 566 H806 L822 600 Z" fill={v("white")} />
      {[576, 584, 592].map((y) => (
        <path key={y} d={`M732 ${y} H${786 + (y - 576) / 2}`} stroke={INK} strokeWidth="1" opacity="0.6" />
      ))}
      <path d="M672 590 Q668 580 674 572" stroke={INK} strokeWidth="1.4" fill="none" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="674" cy="566" rx="3.5" ry="7" transform={`rotate(${a} 674 572)`} fill={v("white")} />
      ))}
      <circle cx="674" cy="572" r="2.5" fill={v("wall-d")} />
      <rect x="826" y="590" width="70" height="7" rx="3" fill={v("white")} transform="rotate(-6 860 594)" />
    </g>
  );
}

function FernPot() {
  const fronds: [number, number][] = [[-70, 120], [-40, 150], [-10, 165], [20, 150], [50, 125], [75, 95]];
  return (
    <g>
      {fronds.map(([a, len], i) => {
        const rad = ((a - 90) * Math.PI) / 180;
        const ex = 122 + Math.cos(rad) * len;
        const ey = 782 + Math.sin(rad) * len;
        const cx = 122 + Math.cos(rad) * len * 0.5 + (a > 0 ? 18 : -18);
        const cy = 782 + Math.sin(rad) * len * 0.5;
        return (
          <g key={i}>
            <path d={`M122 782 Q${cx} ${cy} ${ex} ${ey}`} stroke={INK} strokeWidth="1.6" fill="none" />
            {Array.from({ length: 6 }, (_, k) => {
              const t = 0.25 + k * 0.12;
              const px = (1 - t) ** 2 * 122 + 2 * (1 - t) * t * cx + t ** 2 * ex;
              const py = (1 - t) ** 2 * 782 + 2 * (1 - t) * t * cy + t ** 2 * ey;
              return (
                <g key={k}>
                  <ellipse cx={px - 7} cy={py} rx="8" ry="3.5" transform={`rotate(${a - 30} ${px} ${py})`} fill={v("white")} />
                  <ellipse cx={px + 7} cy={py} rx="8" ry="3.5" transform={`rotate(${a + 30} ${px} ${py})`} fill={v("white")} />
                </g>
              );
            })}
          </g>
        );
      })}
      <path d="M78 790h88l-10 92h-68Z" fill={v("cream")} />
      <rect x="72" y="782" width="100" height="16" rx="8" fill={v("white")} />
    </g>
  );
}

export const GARDEN_ART: Partial<Record<ItemId, ComponentType>> = {
  "paper-lantern": PaperLantern,
  "flower-calendar": FlowerCalendar,
  "watering-can": WateringCan,
  "flower-notebook": FlowerNotebook,
  "fern-pot": FernPot,
};

export const GARDEN_GLOWS: Partial<Record<string, Glow[]>> = {
  "paper-lantern": [{ cx: 1000, cy: 200, r: 240 }],
};
