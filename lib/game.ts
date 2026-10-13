// Pure game logic. No I/O: time and randomness are always passed in.
import {
  ITEMS,
  ITEM_BY_ID,
  PIECES,
  SKY_PHASES,
  THEME_BY_ID,
  WINDOWS,
  WINDOW_INFO,
  type ItemId,
  type PieceId,
  type Rarity,
  type SkyPhase,
  type Slot,
  type ThemeId,
  type TimeWindow,
} from "../content/catalog";

export const BLOCK_MS = 5 * 60_000; // one drop per 5 focused minutes
export const COUNT_WEIGHTS = [0.1, 0.2, 0.4, 0.2, 0.1]; // P(1..5 pieces per drop), 3 most common
export const PITY_AFTER = 8; // consecutive commons before a guaranteed rare
export const ODDS = { special: 0.05, rare: 0.25 }; // common = remainder
const V1_BLOCK_MS = 30 * 60_000;

export type Segment = { start: number; end: number | null };
export type Timer = { segments: Segment[]; blocksAwarded: number; piecesEarned: number }; // piecesEarned: this session
export type State = {
  version: 4;
  timer: Timer;
  carryMs: number; // focused time left over from previous sessions, < BLOCK_MS
  daily: Record<string, number>; // local YYYY-MM-DD -> focused ms (closed segments only)
  pieces: Partial<Record<PieceId, number>>;
  rollsSinceRare: number;
  unlockedThemes: ThemeId[];
  room: Partial<Record<Slot, ItemId>>;
};
export type Drop = { pieceId: PieceId; rarity: Rarity; window: TimeWindow; at: number };
export type Rng = () => number;
type Result = { state: State; drops: Drop[] };

export function initialState(): State {
  return {
    version: 4,
    timer: { segments: [], blocksAwarded: 0, piecesEarned: 0 },
    carryMs: 0,
    daily: {},
    pieces: {},
    rollsSinceRare: 0,
    unlockedThemes: [],
    room: {},
  };
}

// ---------- time ----------

export function windowAt(ts: number): TimeWindow {
  const h = new Date(ts).getHours();
  return WINDOWS.find((w) => {
    const { from, to } = WINDOW_INFO[w];
    return from < to ? h >= from && h < to : h >= from || h < to;
  })!;
}

export function skyPhaseAt(ts: number): SkyPhase {
  const h = new Date(ts).getHours();
  const phase = [...SKY_PHASES].reverse().find((p) => h >= p.from);
  return (phase ?? SKY_PHASES[SKY_PHASES.length - 1]).id;
}

export function nextWindowChange(now: number): { window: TimeWindow; at: number } {
  const d = new Date(now);
  for (let day = 0; day < 2; day++) {
    for (const w of WINDOWS.map((w) => WINDOW_INFO[w].from).sort((a, b) => a - b)) {
      const at = new Date(d.getFullYear(), d.getMonth(), d.getDate() + day, w).getTime();
      if (at > now) return { window: windowAt(at), at };
    }
  }
  throw new Error("unreachable");
}

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Adds [start, end) to the daily totals, split at local midnights. */
export function addSpan(daily: Record<string, number>, start: number, end: number): Record<string, number> {
  const out = { ...daily };
  for (let t = start; t < end; ) {
    const d = new Date(t);
    const stop = Math.min(end, new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime());
    const k = dayKey(t);
    out[k] = (out[k] ?? 0) + (stop - t);
    t = stop;
  }
  return out;
}

export function studiedOn(s: State, key: string, now: number): number {
  const open = s.timer.segments.at(-1);
  const live = open && open.end === null ? (addSpan({}, open.start, Math.max(open.start, now))[key] ?? 0) : 0;
  return (s.daily[key] ?? 0) + live;
}

// ---------- timer ----------

export function timerStatus(t: Timer): "idle" | "running" | "paused" {
  const last = t.segments.at(-1);
  return !last ? "idle" : last.end === null ? "running" : "paused";
}

export function focusedMs(t: Timer, now: number): number {
  return t.segments.reduce((sum, s) => sum + Math.max(0, (s.end ?? now) - s.start), 0);
}

export function pendingBlocks(s: State, now: number): number {
  return Math.floor((s.carryMs + focusedMs(s.timer, now)) / BLOCK_MS) - s.timer.blocksAwarded;
}

/** Wall-clock time at which block k (1-based, counted in this session) completed. */
export function blockCompletedAt(s: State, k: number, now: number): number {
  let need = k * BLOCK_MS - s.carryMs;
  // Fully covered by carried-over time (e.g. after a migration): it completes at session start, or now if idle.
  if (need <= 0) return s.timer.segments[0]?.start ?? now;
  for (const seg of s.timer.segments) {
    const len = (seg.end ?? Infinity) - seg.start;
    if (need <= len) return seg.start + Math.max(0, need);
    need -= len;
  }
  throw new Error("BLOCK_NOT_COMPLETE");
}

export function start(s: State, now: number): State {
  if (timerStatus(s.timer) !== "idle") return s;
  return { ...s, timer: { segments: [{ start: now, end: null }], blocksAwarded: 0, piecesEarned: 0 } };
}

export function pause(s: State, now: number): State {
  if (timerStatus(s.timer) !== "running") return s;
  const segments = s.timer.segments.slice();
  const open = segments[segments.length - 1];
  const end = Math.max(open.start, now);
  segments[segments.length - 1] = { start: open.start, end };
  return { ...s, daily: addSpan(s.daily, open.start, end), timer: { ...s.timer, segments } };
}

export function resume(s: State, now: number): State {
  if (timerStatus(s.timer) !== "paused") return s;
  return { ...s, timer: { ...s.timer, segments: [...s.timer.segments, { start: now, end: null }] } };
}

export function end(s: State, now: number, rng: Rng): Result {
  if (timerStatus(s.timer) === "idle") return { state: s, drops: [] };
  const { state, drops } = award(pause(s, now), now, rng);
  const total = state.carryMs + focusedMs(state.timer, now);
  return {
    state: { ...state, carryMs: total - state.timer.blocksAwarded * BLOCK_MS, timer: initialState().timer },
    drops,
  };
}

// ---------- drops ----------

/** Number of pieces in one drop, 1..5, by COUNT_WEIGHTS. */
export function pieceCount(rng: Rng): number {
  let r = rng();
  for (let i = 0; i < COUNT_WEIGHTS.length; i++) {
    r -= COUNT_WEIGHTS[i];
    if (r < 0) return i + 1;
  }
  return COUNT_WEIGHTS.length;
}

export function roll(window: TimeWindow, rollsSinceRare: number, rng: Rng) {
  const r = rng();
  let rarity: Rarity = r < ODDS.special ? "special" : r < ODDS.special + ODDS.rare ? "rare" : "common";
  if (rarity === "common" && rollsSinceRare >= PITY_AFTER) rarity = "rare";
  const pool = PIECES.filter((p) => p.window === window && p.rarity === rarity);
  const piece = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
  return { pieceId: piece.id as PieceId, rarity, rollsSinceRare: rarity === "common" ? rollsSinceRare + 1 : 0 };
}

/** One drop of 1–5 pieces per completed block, each in the time window where it completed. */
export function award(s: State, now: number, rng: Rng): Result {
  const n = pendingBlocks(s, now);
  if (n <= 0) return { state: s, drops: [] };
  const pieces = { ...s.pieces };
  let since = s.rollsSinceRare;
  const drops: Drop[] = [];
  for (let i = 1; i <= n; i++) {
    const at = blockCompletedAt(s, s.timer.blocksAwarded + i, now);
    const window = windowAt(at);
    for (let c = pieceCount(rng); c > 0; c--) {
      const r = roll(window, since, rng);
      since = r.rollsSinceRare;
      pieces[r.pieceId] = (pieces[r.pieceId] ?? 0) + 1;
      drops.push({ pieceId: r.pieceId, rarity: r.rarity, window, at });
    }
  }
  return {
    state: {
      ...s,
      pieces,
      rollsSinceRare: since,
      // Idle (only carried-over time): spend it from the carry so the next session can't award it again.
      ...(s.timer.segments.length === 0
        ? { carryMs: s.carryMs - n * BLOCK_MS }
        : { timer: { ...s.timer, blocksAwarded: s.timer.blocksAwarded + n, piecesEarned: s.timer.piecesEarned + drops.length } }),
    },
    drops,
  };
}

/** Called periodically and on app open. */
export function tick(s: State, now: number, rng: Rng): Result {
  const open = s.timer.segments.at(-1);
  // Device clock moved backwards: stop the timer, keep what was earned.
  if (open && open.end === null && now < open.start) return end(s, open.start, rng);
  return award(s, now, rng);
}

// ---------- themes & room ----------

export function missingFor(s: State, themeId: ThemeId): { pieceId: PieceId; need: number }[] {
  return Object.entries(THEME_BY_ID[themeId].recipe).flatMap(([id, qty]) => {
    const have = s.pieces[id as PieceId] ?? 0;
    return have < qty ? [{ pieceId: id as PieceId, need: qty - have }] : [];
  });
}

export function unlock(s: State, themeId: ThemeId): State {
  if (s.unlockedThemes.includes(themeId)) throw new Error("ALREADY_UNLOCKED");
  if (missingFor(s, themeId).length) throw new Error("INSUFFICIENT_PIECES");
  const pieces = { ...s.pieces };
  for (const [id, qty] of Object.entries(THEME_BY_ID[themeId].recipe)) {
    pieces[id as PieceId] = (pieces[id as PieceId] ?? 0) - qty;
  }
  return { ...s, pieces, unlockedThemes: [...s.unlockedThemes, themeId] };
}

export function place(s: State, slot: Slot, itemId: ItemId | null): State {
  if (itemId === null) {
    const room = { ...s.room };
    delete room[slot];
    return { ...s, room };
  }
  const item = ITEM_BY_ID[itemId];
  if (!item || !s.unlockedThemes.includes(item.themeId)) throw new Error("ITEM_LOCKED");
  if (item.slot !== slot) throw new Error("SLOT_MISMATCH");
  return { ...s, room: { ...s.room, [slot]: itemId } };
}

export function applyTheme(s: State, themeId: ThemeId): State {
  return ITEMS.filter((i) => i.themeId === themeId).reduce((acc, i) => place(acc, i.slot, i.id), s);
}

// ---------- persistence shape ----------

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Validates stored or imported state and upgrades older versions. Throws INVALID_STATE. */
export function migrate(raw: unknown): State {
  if (!isObj(raw) || ![1, 2, 3, 4].includes(raw.version as number)) throw new Error("INVALID_STATE");
  const base = initialState();
  const timer = { ...base.timer, ...(isObj(raw.timer) ? raw.timer : {}) } as Timer;
  // v1 counted 30-minute blocks; v2 counts 5-minute rolls.
  if (raw.version === 1 && typeof timer.blocksAwarded === "number") timer.blocksAwarded *= V1_BLOCK_MS / BLOCK_MS;
  const { rollsSinceDrop: _drop, ...rest } = raw; // v2-only field
  void _drop;
  const s = { ...base, ...rest, version: 4, timer } as State;
  const ok =
    Array.isArray(s.timer.segments) &&
    s.timer.segments.every((g) => isObj(g) && typeof g.start === "number" && (g.end === null || typeof g.end === "number")) &&
    typeof s.timer.blocksAwarded === "number" &&
    typeof s.timer.piecesEarned === "number" &&
    typeof s.carryMs === "number" &&
    typeof s.rollsSinceRare === "number" &&
    isObj(s.daily) &&
    isObj(s.pieces) &&
    isObj(s.room) &&
    Array.isArray(s.unlockedThemes);
  if (!ok) throw new Error("INVALID_STATE");
  return s;
}
