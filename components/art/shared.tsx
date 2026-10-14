"use client";
import { useEffect, useState, type ReactNode } from "react";

// Shared helpers for room item art (1440x900 stage coordinates).
export const v = (name: string) => `var(--c-${name})`;
export const INK = "var(--line-art)";

/** How far the background runs past the 1440x900 stage, in stage units: enough for a 21:9 monitor or a half-screen window. */
export const OVER = 2400;

/** A white tube (handle, arm, stem) with a pencil outline: ink stroke underneath, white stroke on top. */
export function Tube({ d, width = 6 }: { d: string; width?: number }) {
  return (
    <>
      <path d={d} stroke={INK} strokeWidth={width + 4.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={v("white")} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

/** Today's date, refreshed every minute so calendars turn over at midnight. */
function useToday() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

/** Month, big day number, and weekday, centered in a box. Text is never outlined by the line-art rule. */
export function CalendarFace({ x, y, w, h, color = INK }: { x: number; y: number; w: number; h: number; color?: string }) {
  const d = useToday();
  return (
    <g style={{ fill: color }} textAnchor="middle">
      <text x={x + w / 2} y={y + h * 0.26} fontSize={h * 0.16} fontWeight="600">
        {d.getMonth() + 1}월
      </text>
      <text x={x + w / 2} y={y + h * 0.72} fontSize={h * 0.46} fontWeight="700">
        {d.getDate()}
      </text>
      <text x={x + w / 2} y={y + h * 0.92} fontSize={h * 0.13}>
        {WEEKDAY_KO[d.getDay()]}요일
      </text>
    </g>
  );
}

/** Pencil-drawn wallpaper pattern tiled over the wall (behind the window). */
export function WallPattern({ id, size, children }: { id: string; size: number; children: ReactNode }) {
  return (
    <>
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          {children}
        </pattern>
      </defs>
      {/* overscanned like the wall (Room OVER), so wide or tall windows keep the pattern */}
      <rect className="no-line" x={-OVER} y={-OVER} width={1440 + 2 * OVER} height={706 + OVER} fill={`url(#${id})`} />
    </>
  );
}

// ---------- desks: 2D with depth (SPEC §4.3, D19) ----------
// One shared tabletop seen slightly from above: back edge y=600 (where desk objects stand), front edge y=640.
// Depth comes only from paper tones: top = desk, front faces = desk-d, side faces = wall-d.

/** The shared tabletop: slanted end faces, top surface, front thickness. */
export function DeskTop({ thickness = 22 }: { thickness?: number }) {
  return (
    <g>
      <path d={`M190 640 L230 600 V${600 + thickness} L190 ${640 + thickness} Z`} fill={v("wall-d")} />
      <path d={`M1250 640 L1210 600 V${600 + thickness} L1250 ${640 + thickness} Z`} fill={v("wall-d")} />
      <path d="M230 600 H1210 L1250 640 H190 Z" fill={v("desk")} />
      <rect x="190" y="640" width="1060" height={thickness} fill={v("desk-d")} />
    </g>
  );
}

/** A square leg: front face plus the side face that turns toward the room's center (side 1 = right, -1 = left). */
export function DeskLeg({ x, top, bottom, w = 28, side }: { x: number; top: number; bottom: number; w?: number; side: 1 | -1 }) {
  const d = 10; // visible side depth
  const edge = side === 1 ? x + w : x;
  return (
    <g>
      <path d={`M${edge} ${top} L${edge + d * side} ${top - d} V${bottom - d} L${edge} ${bottom} Z`} fill={v("wall-d")} />
      <rect x={x} y={top} width={w} height={bottom - top} fill={v("desk-d")} />
    </g>
  );
}

/** Back legs sit further away, so they stop higher on the floor. */
export function BackLegs({ left = 272, right = 1146, w = 22, top = 622, bottom = 858 }: { left?: number; right?: number; w?: number; top?: number; bottom?: number }) {
  return (
    <g>
      <rect x={left} y={top} width={w} height={bottom - top} fill={v("wall-d")} />
      <rect x={right} y={top} width={w} height={bottom - top} fill={v("wall-d")} />
    </g>
  );
}
