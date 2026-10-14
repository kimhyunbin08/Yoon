"use client";
import { useId, type ComponentType } from "react";
import type { ItemId } from "../../../content/catalog";
import type { Glow } from "../items";
import { CalendarFace, Glitch, INK, NEON_CYAN, NEON_PINK, v } from "../shared";

// 네온 글리치 (neon-glitch): the one theme allowed a saturated wall (SPEC §4.3).
// Pre-v5 items (blinds, neon sign, boombox, neon tube, CRT) live in items.tsx.

function NeonWallpaper() {
  const id = `neonwall${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  // Synthwave grid: horizon at y=520, lines converging to the center.
  const horizon = 520;
  const rows = [530, 546, 568, 598, 640, 700];
  const cols = Array.from({ length: 17 }, (_, i) => -480 + i * 150);
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--neon-wall-top)" }} />
          <stop offset="1" style={{ stopColor: "var(--neon-wall-bottom)" }} />
        </linearGradient>
      </defs>
      <rect className="no-line" width="1440" height="706" fill={`url(#${id})`} />
      <g stroke={NEON_CYAN} strokeWidth="1.6" opacity="0.45" fill="none">
        <path d={`M0 ${horizon} H1440`} />
        {rows.map((y) => (
          <path key={y} d={`M0 ${y} H1440`} />
        ))}
        {cols.map((x) => (
          <path key={x} d={`M720 ${horizon} L${x} 706`} />
        ))}
      </g>
    </g>
  );
}

function LedCalendar() {
  return (
    <Glitch>
      <rect x="166" y="62" width="168" height="114" rx="12" fill={v("white")} />
      <rect x="178" y="74" width="144" height="90" rx="6" style={{ fill: "var(--c-ink)" }} />
      <CalendarFace x={178} y={74} w={144} h={90} color={NEON_PINK} />
      <rect x="188" y="148" width="40" height="3" fill={NEON_CYAN} opacity="0.7" />
    </Glitch>
  );
}

function NeonDesk() {
  return (
    <Glitch>
      {[244, 1180].map((x) => (
        <g key={x}>
          <rect x={x} y="628" width="14" height="272" fill={v("desk-d")} />
          <rect x={x - 18} y="890" width="50" height="10" rx="3" fill={v("desk-d")} />
        </g>
      ))}
      <rect x="258" y="800" width="922" height="10" fill={v("desk-d")} />
      <rect x="210" y="610" width="1020" height="20" fill={v("desk-d")} />
      <rect x="200" y="598" width="1040" height="14" rx="3" fill={v("desk")} />
      {/* LED strip under the top: a light source */}
      <rect x="214" y="630" width="1012" height="5" rx="2.5" style={{ fill: NEON_CYAN }} />
    </Glitch>
  );
}

function RetroKeyboard() {
  return (
    <Glitch>
      <path d="M616 600 L626 566 H806 L816 600 Z" fill={v("white")} />
      {[0, 1, 2].map((row) =>
        Array.from({ length: 11 - row }, (_, k) => (
          <rect key={`${row}-${k}`} x={634 + row * 6 + k * 15} y={572 + row * 9} width="12" height="7" rx="1.5" fill={v("white")} />
        )),
      )}
      <rect x="664" y="590" width="100" height="6" rx="2" fill={v("white")} />
      <rect x="649" y="572" width="12" height="7" rx="1.5" fill={NEON_PINK} opacity="0.85" />
      <rect x="760" y="581" width="12" height="7" rx="1.5" fill={NEON_CYAN} opacity="0.85" />
      <path d="M816 590 Q836 560 828 540 Q820 520 840 512" stroke={INK} strokeWidth="2" fill="none" />
    </Glitch>
  );
}

function NeonCactus() {
  const outline = "M108 790 V600 Q108 576 124 576 Q140 576 140 600 V790 M108 700 H92 Q80 700 80 686 V650 Q80 638 90 638 Q100 638 100 650 V690 H108 M140 668 H156 Q168 668 168 654 V626 Q168 614 158 614 Q148 614 148 626 V660 H140";
  return (
    <Glitch>
      <path d="M108 790 V600 Q108 576 124 576 Q140 576 140 600 V790 Z" fill={v("white")} />
      <path d="M108 700 H92 Q80 700 80 686 V650 Q80 638 90 638 Q100 638 100 650 V690 H108 Z" fill={v("white")} />
      <path d="M140 668 H156 Q168 668 168 654 V626 Q168 614 158 614 Q148 614 148 626 V660 H140 Z" fill={v("white")} />
      {/* neon outline: the cactus is a light sign */}
      <path d={outline} stroke={NEON_CYAN} strokeWidth="3" fill="none" strokeLinejoin="round" />
      <path d="M78 790h88l-10 92h-68Z" fill={v("white")} />
      <rect x="72" y="782" width="100" height="16" rx="8" fill={v("white")} />
      <path d="M86 830 H158" stroke={NEON_PINK} strokeWidth="3" />
    </Glitch>
  );
}

function NeonRug() {
  return (
    <Glitch>
      <path d="M330 792 H1110 L1170 882 H270 Z" fill={v("white")} />
      <g stroke={NEON_PINK} strokeWidth="1.6" opacity="0.7" fill="none">
        {[810, 830, 852, 876].map((y) => (
          <path key={y} d={`M${330 - (y - 792) * 0.66} ${y} H${1110 + (y - 792) * 0.66}`} />
        ))}
        {Array.from({ length: 13 }, (_, i) => (
          <path key={i} d={`M${330 + i * 65} 792 L${270 + i * 75} 882`} />
        ))}
      </g>
    </Glitch>
  );
}

export const NEON_ART: Partial<Record<ItemId, ComponentType>> = {
  "neon-wallpaper": NeonWallpaper,
  "led-calendar": LedCalendar,
  "neon-desk": NeonDesk,
  "retro-keyboard": RetroKeyboard,
  "neon-cactus": NeonCactus,
  "neon-rug": NeonRug,
};

export const NEON_GLOWS: Partial<Record<string, Glow[]>> = {
  "led-calendar": [{ cx: 390, cy: 172, r: 150, color: "pink" }], // calendar slot is translated (140, 52) in Room
  "neon-desk": [360, 620, 880, 1120].map((cx) => ({ cx, cy: 640, r: 150, color: "cyan" as const })),
  "neon-cactus": [{ cx: 124, cy: 680, r: 170, color: "cyan" }],
};
