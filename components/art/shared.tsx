"use client";
import { useEffect, useState, type ReactNode } from "react";
import { dayKey } from "../../lib/game";
import { useStore } from "../../lib/store";
import { boardLines } from "../../lib/todos";

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

/**
 * The wall board inside every calendar (SPEC US-10): a one-line date header, up to 4 to-dos
 * (open first, then today's done ones struck through), "+N" for the rest, and today's 인장 stamp.
 * Text is never outlined by the line-art rule.
 */
export function CalendarFace({ x, y, w, h, color = INK }: { x: number; y: number; w: number; h: number; color?: string }) {
  const d = useToday();
  const state = useStore((s) => s.state);
  const { lines, more } = boardLines(state);
  const sealed = state.sealAwardedOn === dayKey(d.getTime());
  const head = h * 0.15;
  const size = h * 0.12;
  const row = h * 0.17;
  const maxChars = Math.max(4, Math.floor((w - size * 2.4) / (size * 0.95)));
  const fit = (t: string) => (t.length > maxChars ? `${t.slice(0, maxChars - 1)}…` : t);
  return (
    <g style={{ fill: color }}>
      <text x={x + 6} y={y + head} fontSize={size * 1.05} fontWeight="700">
        {d.getMonth() + 1}월 {d.getDate()}일 {WEEKDAY_KO[d.getDay()]}요일
      </text>
      <path d={`M${x + 6} ${y + head + 4} H${x + w - 6}`} stroke={color} strokeWidth="0.8" opacity="0.5" />
      {lines.length === 0 ? (
        <text x={x + 6} y={y + head + row * 1.4} fontSize={size * 0.9} opacity="0.55">
          할 일을 적어 보세요
        </text>
      ) : (
        lines.map((t, i) => {
          const cy = y + head + row * (i + 1.2);
          return (
            <g key={t.id} opacity={t.done ? 0.5 : 1}>
              <rect x={x + 6} y={cy - size * 0.75} width={size * 0.8} height={size * 0.8} rx="1.5" fill="none" stroke={color} strokeWidth="0.9" />
              {t.done && <path d={`M${x + 7.2} ${cy - size * 0.35} l${size * 0.25} ${size * 0.25} l${size * 0.4} ${-size * 0.55}`} fill="none" stroke={color} strokeWidth="1" />}
              <text x={x + 6 + size * 1.3} y={cy} fontSize={size} textDecoration={t.done ? "line-through" : undefined}>
                {fit(t.text)}
              </text>
            </g>
          );
        })
      )}
      {more > 0 && (
        <text x={x + w - 6} y={y + h - 3} fontSize={size * 0.85} textAnchor="end" opacity="0.6">
          +{more}
        </text>
      )}
      {sealed && (
        // today's 인장: a pencil stamp, tilted like a real one
        <g transform={`rotate(-14 ${x + w - 14} ${y + head + row * 3.2})`} opacity="0.85">
          <circle cx={x + w - 14} cy={y + head + row * 3.2} r={h * 0.13} fill="none" stroke={color} strokeWidth="1.4" />
          <text x={x + w - 14} y={y + head + row * 3.2 + size * 0.35} fontSize={size} fontWeight="700" textAnchor="middle">
            인
          </text>
        </g>
      )}
    </g>
  );
}

/** Plain paper board shown when the calendar slot is empty, so the to-dos always have a home. Calendar art coordinates. */
export function PaperBoard() {
  return (
    <g>
      <g transform="rotate(-1.5 250 118)">
        <rect x="172" y="58" width="156" height="120" rx="3" fill={v("white")} />
        <path d="M312 178 L328 162 V178 Z" fill={v("wall-d")} />
        <CalendarFace x={176} y={66} w={148} h={106} />
      </g>
      <circle cx="250" cy="60" r="5" fill={v("white")} />
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
