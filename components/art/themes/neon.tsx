"use client";
import { useId, type ComponentType } from "react";
import type { ItemId } from "../../../content/catalog";
import type { Glow } from "../items";
import { CalendarFace, Glitch, NEON_CYAN, NEON_PINK, v } from "../shared";

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

/** Neon desk lamp: a looped cyan tube on a white base. */
function NeonLamp() {
  return (
    <Glitch>
      <rect x="1064" y="584" width="84" height="16" rx="5" fill={v("white")} />
      <path d="M1088 584 V470 Q1088 444 1106 444 Q1124 444 1124 470 V584" stroke={NEON_CYAN} strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="1106" cy="500" r="16" fill="none" stroke={NEON_PINK} strokeWidth="4" />
    </Glitch>
  );
}

export const NEON_ART: Partial<Record<ItemId, ComponentType>> = {
  "neon-lamp": NeonLamp,
  "neon-wallpaper": NeonWallpaper,
  "led-calendar": LedCalendar,
};

export const NEON_GLOWS: Partial<Record<string, Glow[]>> = {
  // in calendar art coordinates; Room maps calendar/wall-decor glows into their scaled spots
  "led-calendar": [{ cx: 250, cy: 120, r: 90, color: "pink" }],
  "neon-lamp": [{ cx: 1106, cy: 510, r: 240, color: "cyan" }],
};
