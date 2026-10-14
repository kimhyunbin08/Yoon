"use client";
import { useEffect, useState, type ReactNode } from "react";

// Shared helpers for room item art (1440x900 stage coordinates).
export const v = (name: string) => `var(--c-${name})`;
export const INK = "var(--line-art)";
export const NEON_PINK = "var(--neon-pink)";
export const NEON_CYAN = "var(--neon-cyan)";

/** Neon glitch theme: frozen RGB split. The filter is defined once per Room (<filter id="stillroom-rgbsplit">). */
export const Glitch = ({ children }: { children: ReactNode }) => <g filter="url(#stillroom-rgbsplit)">{children}</g>;

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
export function useToday() {
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
      <rect className="no-line" width="1440" height="706" fill={`url(#${id})`} />
    </>
  );
}
