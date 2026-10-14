"use client";
import { useEffect, useState, type ReactNode } from "react";
import { PIECE_BY_ID, WINDOW_INFO } from "../content/catalog";
import { dayKey, focusedMs, nextWindowChange, studiedOn, timerStatus, windowAt } from "../lib/game";
import { useStore } from "../lib/store";
import { PieceIcon } from "./art/pieces";

export function useNow(intervalMs: number, enabled = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
  return now;
}

export function fmtDuration(ms: number) {
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

function fmtClock(ms: number) {
  const s = Math.floor(ms / 1000);
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, "0")).join(":");
}

const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

export const Icon = {
  pieces: <Svg><path d="M12 3l3 6 6 1-4.5 4 1 6L12 17l-5.5 3 1-6L3 10l6-1Z" /></Svg>,
  themes: <Svg><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><path d="M17 13v8M13 17h8" /></Svg>,
  decorate: <Svg><path d="M4 20l4-1 11-11-3-3L5 16Z" /><path d="M14 6l3 3" /></Svg>,
  records: <Svg><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Svg>,
  play: <Svg><path d="M7 4l13 8-13 8Z" fill="currentColor" /></Svg>,
  pause: <Svg><path d="M8 4v16M16 4v16" /></Svg>,
  stop: <Svg><rect x="5" y="5" width="14" height="14" rx="3" /></Svg>,
  fullscreen: <Svg><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></Svg>,
  close: <Svg><path d="M6 6l12 12M18 6L6 18" /></Svg>,
};

export function WindowChip({ now }: { now: number }) {
  const pieces = useStore((s) => s.state.pieces);
  const win = windowAt(now);
  const next = nextWindowChange(now);
  return (
    <div className="ui-fade absolute left-6 top-6 flex flex-col gap-2 rounded-2xl bg-surface px-4 py-3 shadow-[0_4px_16px_rgb(59_58_69/0.08)] backdrop-blur">
      <p className="text-sm">
        <strong className="font-semibold">{WINDOW_INFO[win].nameKo}</strong>
        <span className="text-muted"> · {WINDOW_INFO[next.window].nameKo}까지 {fmtDuration(next.at - now)}</span>
      </p>
      <div className="flex items-center gap-2 text-sm" aria-label="지금 나오는 조각">
        <PieceIcon id={win} size={28} />
        <span>
          {PIECE_BY_ID[win].nameKo} <span className="tabular font-semibold">{pieces[win] ?? 0}</span>개
        </span>
      </div>
    </div>
  );
}

/** The only element that re-renders every second. Stays visible in ambient mode. */
export function TimerPill() {
  const state = useStore((s) => s.state);
  const status = timerStatus(state.timer);
  const t = useNow(status === "running" ? 1000 : 30_000);
  return (
    <div className="absolute right-6 top-6 flex flex-col items-end gap-1 rounded-2xl bg-surface px-4 py-3 text-right shadow-[0_4px_16px_rgb(59_58_69/0.08)] backdrop-blur">
      {status !== "idle" && (
        <p className="tabular text-2xl font-semibold" aria-label="이번 공부 시간">
          {fmtClock(focusedMs(state.timer, t))}
          {status === "paused" && <span className="ml-2 align-middle text-sm font-normal text-muted">일시정지</span>}
        </p>
      )}
      {status !== "idle" && (
        <p className="text-xs text-muted" aria-label="이번에 모은 조각">
          이번에 모은 조각 <span className="tabular font-semibold text-text">{state.timer.piecesEarned}</span>개
        </p>
      )}
      <p className="text-xs text-muted">오늘 {fmtDuration(studiedOn(state, dayKey(t), t))}</p>
    </div>
  );
}

function Btn({ onClick, children, primary, label }: { onClick: () => void; children: ReactNode; primary?: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold shadow-[0_4px_16px_rgb(59_58_69/0.08)] transition hover:brightness-105 active:scale-[0.98] ${
        primary ? "bg-primary text-[#3b3a45]" : "bg-surface text-text backdrop-blur"
      }`}
    >
      {children}
    </button>
  );
}

export function Controls({
  status,
  onStart,
  onPause,
  onResume,
  onEnd,
  onFullscreen,
}: {
  status: "idle" | "running" | "paused";
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onFullscreen: () => void;
}) {
  return (
    <div className="ui-fade absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-3">
      {status === "idle" && <Btn primary onClick={onStart}>{Icon.play}공부 시작</Btn>}
      {status === "running" && <Btn primary onClick={onPause}>{Icon.pause}일시정지</Btn>}
      {status === "paused" && <Btn primary onClick={onResume}>{Icon.play}이어하기</Btn>}
      {status !== "idle" && <Btn onClick={onEnd}>{Icon.stop}끝내기</Btn>}
      <Btn onClick={onFullscreen} label="전체 화면 (F)">{Icon.fullscreen}</Btn>
    </div>
  );
}

export type PanelId = "pieces" | "themes" | "decorate" | "records";
const MENU: { id: PanelId; label: string }[] = [
  { id: "pieces", label: "조각함" },
  { id: "themes", label: "테마" },
  { id: "decorate", label: "꾸미기" },
  { id: "records", label: "기록" },
];

export function Menu({ active, onOpen }: { active: PanelId | null; onOpen: (p: PanelId) => void }) {
  return (
    <nav className="ui-fade absolute left-6 top-1/2 flex -translate-y-1/2 flex-col gap-2 rounded-full bg-surface p-2 shadow-[0_4px_16px_rgb(59_58_69/0.08)] backdrop-blur" aria-label="메뉴">
      {MENU.map((m, i) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onOpen(m.id)}
          title={`${m.label} (${i + 1})`}
          aria-label={m.label}
          aria-pressed={active === m.id}
          className={`group relative flex h-11 w-11 items-center justify-center rounded-full transition ${active === m.id ? "bg-primary text-[#3b3a45]" : "hover:bg-line"}`}
        >
          {Icon[m.id]}
          <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-full bg-surface-solid px-3 py-1 text-xs opacity-0 shadow transition group-hover:opacity-100 group-focus-visible:opacity-100">
            {m.label} <span className="text-muted">{i + 1}</span>
          </span>
        </button>
      ))}
    </nav>
  );
}

export type Toast = { id: number; text: string };

export function Toasts({ items }: { items: Toast[] }) {
  return (
    <div className="pointer-events-none absolute bottom-8 right-6 flex flex-col items-end gap-2" role="status" aria-live="polite">
      {items.map((t) => (
        <p
          key={t.id}
          className="anim-toast rounded-full bg-surface px-4 py-2 text-sm shadow-[0_4px_16px_rgb(59_58_69/0.08)] backdrop-blur"
        >
          {t.text}
        </p>
      ))}
    </div>
  );
}
