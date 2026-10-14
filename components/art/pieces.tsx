"use client";
import { useId, type ReactNode } from "react";
import { PIECE_BY_ID, type PieceId } from "../../content/catalog";

// The four window pieces, drawn in the room's style (SPEC §4.3): white paper, colored-pencil outline,
// one soft pastel facet so the four read apart at a glance, and a small etched emblem.
const INK = "var(--line-art)";
const TINT: Record<PieceId, string> = { dawn: "var(--piece-dawn)", day: "var(--piece-day)", evening: "var(--piece-evening)", night: "var(--piece-night)" };

// A faceted shard; facet B is the tinted one.
const SHARD = "M32 4 L52 20 L46 54 L22 60 L10 26 Z";
const FACET_A = "M32 4 L10 26 L28 30 Z";
const FACET_B = "M32 4 L52 20 L28 30 Z";
const FACET_C = "M28 30 L52 20 L46 54 Z";

const EMBLEM: Record<PieceId, ReactNode> = {
  // half sun on the horizon
  dawn: (
    <>
      <path d="M18 46 H40" />
      <path d="M22 46 A7 7 0 0 1 36 46" />
      <path d="M29 34 V36 M20 39 l1.5 1.2 M38 39 l-1.5 1.2" />
    </>
  ),
  // full sun with rays
  day: (
    <>
      <circle cx="29" cy="43" r="5" />
      <path d="M29 33 V35 M29 51 V53 M19 43 H21 M37 43 H39 M22 36 l1.4 1.4 M36 36 l-1.4 1.4" />
    </>
  ),
  // setting sun cut by two horizon lines
  evening: (
    <>
      <path d="M22 44 A7 7 0 0 1 36 44" />
      <path d="M18 44 H40 M21 48 H37 M25 52 H33" />
    </>
  ),
  // crescent and a small star
  night: (
    <>
      <path d="M31 36 A8 8 0 1 0 36 49 A6.5 6.5 0 1 1 31 36 Z" />
      <path d="M38 36 l0.8 1.8 1.8 0.8 -1.8 0.8 -0.8 1.8 -0.8 -1.8 -1.8 -0.8 1.8 -0.8 Z" />
    </>
  ),
};

export function PieceIcon({ id, size = 48 }: { id: PieceId; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    // size is in px at the 16px base; rem keeps icons in step with the fluid UI
    <svg viewBox="0 0 64 64" style={{ width: `${size / 16}rem`, height: `${size / 16}rem` }} role="img" aria-label={PIECE_BY_ID[id].nameKo}>
      <defs>
        {/* the room's colored-pencil wobble, scaled for a small icon */}
        <filter id={`pencil${uid}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="4" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter={`url(#pencil${uid})`} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
        <path d={SHARD} fill="var(--c-white)" />
        <path d={FACET_A} fill="var(--c-white)" />
        <path d={FACET_B} fill={TINT[id]} />
        <path d={FACET_C} fill="var(--piece-shade)" />
        <g fill="none" strokeWidth="1.4">
          {EMBLEM[id]}
        </g>
      </g>
    </svg>
  );
}
