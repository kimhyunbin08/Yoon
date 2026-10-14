"use client";
import { useRef, useState, type ReactNode } from "react";
import {
  ITEMS,
  PIECES,
  PIECE_BY_ID,
  SLOTS,
  SLOT_KO,
  THEMES,
  THEME_BY_ID,
  WINDOW_INFO,
  type ItemId,
  type PieceId,
  type SkyPhase,
  type Slot,
  type ThemeId,
} from "../content/catalog";
import { dayKey, missingFor, studiedOn, windowAt, type State } from "../lib/game";
import {
  MAX_REWARDS,
  MAX_TEXT,
  SEALS_PER_REWARD,
  TODOS_PER_SEAL,
  addReward,
  addTodo,
  claimReward,
  doneToday,
  editTodo,
  moveTodo,
  removeReward,
  removeTodo,
  toggleTodo,
} from "../lib/todos";
import { eventLabel, nextEventId, todayAgenda } from "../lib/calendar";
import { connectGoogle, disconnectGoogle, googleEnabled, refreshAgenda, useGoogle } from "../lib/google";
import { connectNaver, disconnectNaver, refreshNaver, useNaver } from "../lib/naver";
import { exportBackup, readBackup, useStore } from "../lib/store";
import { PieceIcon } from "./art/pieces";
import { Icon, fmtDuration } from "./Hud";
import { Room } from "./Room";

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <aside role="dialog" aria-label={title} className="absolute inset-y-0 right-0 flex w-[27.5rem] max-w-[90vw] flex-col bg-surface shadow-[0_4px_32px_rgb(59_58_69/0.14)] backdrop-blur-md">
      <header className="flex items-center justify-between px-6 pb-3 pt-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button type="button" onClick={onClose} aria-label="닫기 (Esc)" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-line">
          {Icon.close}
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-6 pb-8">{children}</div>
    </aside>
  );
}

const hours = (w: keyof typeof WINDOW_INFO) => `${WINDOW_INFO[w].from}시–${WINDOW_INFO[w].to}시`;

export function PiecesPanel({ now, onClose }: { now: number; onClose: () => void }) {
  const pieces = useStore((s) => s.state.pieces);
  const current = windowAt(now);
  return (
    <Drawer title="조각함" onClose={onClose}>
      <p className="mb-4 text-sm text-muted">공부한 시간대의 조각이 5분마다 1~5개씩 모여요.</p>
      <div className="grid grid-cols-2 gap-3">
        {PIECES.map((p) => (
          <div
            key={p.id}
            className={`flex flex-col items-center gap-2 rounded-2xl bg-surface-solid p-4 ring-2 ${p.window === current ? "ring-ring" : "ring-transparent"}`}
          >
            <PieceIcon id={p.id} size={72} />
            <p className="font-semibold">{p.nameKo}</p>
            <p className="tabular text-2xl font-semibold">{pieces[p.id] ?? 0}</p>
            <p className="text-xs text-muted">
              {hours(p.window)}
              {p.window === current && " · 지금"}
            </p>
            <p className="text-xs text-muted">{THEMES.filter((t) => p.id in t.recipe).map((t) => t.nameKo).join(", ") || "쓰는 테마 없음"}</p>
          </div>
        ))}
      </div>
    </Drawer>
  );
}

export function ThemesPanel({
  phase,
  onUnlock,
  onApply,
  onClose,
}: {
  phase: SkyPhase;
  onUnlock: (id: ThemeId) => void;
  onApply: (id: ThemeId) => void;
  onClose: () => void;
}) {
  const state = useStore((s) => s.state);
  return (
    <Drawer title="테마" onClose={onClose}>
      <div className="flex flex-col gap-5">
        {THEMES.map((t) => {
          const unlocked = state.unlockedThemes.includes(t.id);
          const missing = missingFor(state, t.id);
          const room = Object.fromEntries(ITEMS.filter((i) => i.themeId === t.id).map((i) => [i.slot, i.id]));
          return (
            <article key={t.id} className="overflow-hidden rounded-2xl bg-surface-solid">
              <Room room={room} phase={phase} className="aspect-[16/10] w-full" />
              <div className="p-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold">{t.nameKo}</h3>
                  {unlocked && <span className="text-xs text-muted">열림</span>}
                </div>
                <p className="mb-3 text-sm text-muted">{t.descriptionKo}</p>
                {!unlocked && (
                  <ul className="mb-3 flex flex-wrap gap-2" aria-label="필요한 조각">
                    {Object.entries(t.recipe).map(([id, qty]) => {
                      const have = Math.min(state.pieces[id as PieceId] ?? 0, qty);
                      const p = PIECE_BY_ID[id as PieceId];
                      return (
                        <li
                          key={id}
                          title={p.nameKo}
                          className={`flex items-center gap-1 rounded-full py-1 pl-1 pr-3 text-xs ${have >= qty ? "bg-mint/50" : "bg-line"}`}
                        >
                          <PieceIcon id={p.id} size={22} />
                          <span>{p.nameKo}</span>
                          <span className="tabular font-semibold">
                            {have}/{qty}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {!unlocked && missing.length > 0 && (
                  <p className="mb-3 text-xs text-muted">
                    부족: {missing.map((m) => `${PIECE_BY_ID[m.pieceId].nameKo} ${m.need}개`).join(" · ")}
                  </p>
                )}
                {unlocked ? (
                  <button type="button" onClick={() => onApply(t.id)} className="h-10 w-full rounded-full bg-line text-sm font-semibold">
                    방에 통째로 적용
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={missing.length > 0}
                    onClick={() => onUnlock(t.id)}
                    className="h-10 w-full rounded-full bg-primary text-sm font-semibold text-[#3b3a45] disabled:bg-line disabled:text-muted"
                  >
                    {missing.length ? "조각이 더 필요해요" : "열기"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </Drawer>
  );
}

export function DecoratePanel({
  slot,
  onSlot,
  onPlace,
  onClose,
}: {
  slot: Slot;
  onSlot: (s: Slot) => void;
  onPlace: (s: Slot, id: ItemId | null) => void;
  onClose: () => void;
}) {
  const state = useStore((s) => s.state);
  const items = ITEMS.filter((i) => i.slot === slot);
  return (
    <section role="dialog" aria-label="꾸미기" className="absolute inset-x-0 bottom-0 bg-surface px-8 pb-6 pt-4 shadow-[0_-4px_32px_rgb(59_58_69/0.14)] backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <div role="tablist" className="flex flex-wrap gap-1">
          {SLOTS.map((s) => (
            <button
              key={s}
              role="tab"
              type="button"
              aria-selected={slot === s}
              onClick={() => onSlot(s)}
              className={`h-9 rounded-full px-4 text-sm ${slot === s ? "bg-primary font-semibold text-[#3b3a45]" : "hover:bg-line"}`}
            >
              {SLOT_KO[s]}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="h-9 rounded-full px-4 text-sm font-semibold hover:bg-line">
          완료
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onPlace(slot, null)}
          aria-pressed={!state.room[slot]}
          className={`flex h-20 w-36 shrink-0 items-center justify-center rounded-2xl bg-surface-solid text-sm ring-2 ${!state.room[slot] ? "ring-ring" : "ring-transparent"}`}
        >
          비우기
        </button>
        {items.map((i) => {
          const unlocked = state.unlockedThemes.includes(i.themeId);
          const on = state.room[slot] === i.id;
          return (
            <button
              key={i.id}
              type="button"
              disabled={!unlocked}
              onClick={() => onPlace(slot, i.id)}
              aria-pressed={on}
              className={`flex h-20 w-44 shrink-0 flex-col items-start justify-center rounded-2xl bg-surface-solid px-4 text-left text-sm ring-2 disabled:opacity-50 ${on ? "ring-ring" : "ring-transparent"}`}
            >
              <span className="font-semibold">{i.nameKo}</span>
              <span className="text-xs text-muted">{unlocked ? THEME_BY_ID[i.themeId].nameKo : `잠김 · ${THEME_BY_ID[i.themeId].nameKo}`}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

export function RecordsPanel({ now, onImport, onClose }: { now: number; onImport: (s: State) => void; onClose: () => void }) {
  const state = useStore((s) => s.state);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<State | null>(null);
  const [error, setError] = useState(false);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    const ts = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (6 - i), 12).getTime();
    return { key: dayKey(ts), label: WEEKDAY[new Date(ts).getDay()], ms: studiedOn(state, dayKey(ts), now) };
  });
  const max = Math.max(...days.map((d) => d.ms), 60 * 60_000);
  const week = days.reduce((a, d) => a + d.ms, 0);
  const totalPieces = Object.values(state.pieces).reduce((a, n) => a + (n ?? 0), 0);

  return (
    <Drawer title="기록" onClose={onClose}>
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface-solid p-4">
          <p className="text-xs text-muted">오늘</p>
          <p className="text-2xl font-semibold">{fmtDuration(days[6].ms)}</p>
        </div>
        <div className="rounded-2xl bg-surface-solid p-4">
          <p className="text-xs text-muted">최근 7일</p>
          <p className="text-2xl font-semibold">{fmtDuration(week)}</p>
        </div>
      </div>
      <div className="mb-6 rounded-2xl bg-surface-solid p-4">
        <div className="flex h-40 items-end gap-2">
          {days.map((d, i) => (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`w-full rounded-t-lg ${i === 6 ? "bg-ring" : "bg-primary"}`}
                style={{ height: `${Math.max(2, (d.ms / max) * 128)}px` }}
                aria-label={`${d.label}요일 ${fmtDuration(d.ms)}`}
                title={fmtDuration(d.ms)}
              />
              <span className="text-xs text-muted">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="mb-6 text-sm text-muted">
        지금 가진 조각 {totalPieces}개 · 연 테마 {state.unlockedThemes.length} / {THEMES.length}
      </p>

      <h3 className="mb-2 font-semibold">백업</h3>
      <p className="mb-3 text-sm text-muted">방과 기록은 이 노트북 브라우저에만 저장돼요. 가끔 파일로 받아두세요.</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => exportBackup(state)} className="h-10 flex-1 rounded-full bg-primary text-sm font-semibold text-[#3b3a45]">
          백업하기
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className="h-10 flex-1 rounded-full bg-line text-sm font-semibold">
          불러오기
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          data-testid="backup-input"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try {
              setPending(await readBackup(f));
              setError(false);
            } catch {
              setError(true);
            }
          }}
        />
      </div>
      {error && <p className="mt-3 text-sm text-pink">백업 파일을 읽을 수 없어요</p>}
      {pending && (
        <div className="mt-3 rounded-2xl bg-surface-solid p-4 text-sm">
          <p className="mb-3">지금 방과 기록을 백업 파일 내용으로 바꿀까요? 되돌릴 수 없어요.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onImport(pending);
                setPending(null);
              }}
              className="h-9 flex-1 rounded-full bg-primary font-semibold text-[#3b3a45]"
            >
              바꾸기
            </button>
            <button type="button" onClick={() => setPending(null)} className="h-9 flex-1 rounded-full bg-line font-semibold">
              취소
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}


const shortDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};
const newId = () => crypto.randomUUID();

/** 할 일 drawer (SPEC US-10, US-11): to-dos, 인장, and her own rewards. Every change goes through `apply`. */
export function TodoPanel({
  now,
  apply,
  onClose,
}: {
  now: number;
  apply: (change: (s: State, now: number) => State) => void;
  onClose: () => void;
}) {
  const state = useStore((s) => s.state);
  const [draft, setDraft] = useState("");
  const [rewardDraft, setRewardDraft] = useState("");
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const done = doneToday(state, now);
  const sealedToday = state.sealAwardedOn === dayKey(now);

  const onRowKey = (e: React.KeyboardEvent, id: string) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Delete" || e.key === "Backspace") apply((s, t) => removeTodo(s, id, t));
    else if (e.altKey && e.key === "ArrowUp") apply((s) => moveTodo(s, id, -1));
    else if (e.altKey && e.key === "ArrowDown") apply((s) => moveTodo(s, id, 1));
    else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      apply((s, t) => toggleTodo(s, id, t));
    }
  };

  return (
    <Drawer title="할 일" onClose={onClose}>
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          apply((s, t) => addTodo(s, draft, t, newId()));
          setDraft("");
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={MAX_TEXT}
          placeholder="할 일을 적고 Enter"
          aria-label="새 할 일"
          className="h-10 flex-1 rounded-full bg-surface-solid px-4 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-ring"
        />
        <button type="submit" className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-[#3b3a45]">
          추가
        </button>
      </form>
      {state.todos.length === 0 ? (
        <p className="mb-6 text-sm text-muted">오늘 할 일을 적어 보세요. 벽의 종이 보드에 바로 적혀요.</p>
      ) : (
        <ul className="mb-2 flex flex-col gap-1" aria-label="할 일 목록">
          {state.todos.map((t) => (
            <li
              key={t.id}
              tabIndex={0}
              onKeyDown={(e) => onRowKey(e, t.id)}
              className="group flex items-center gap-2 rounded-xl bg-surface-solid px-3 py-2 text-sm"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={t.done}
                aria-label={`${t.text} 끝냄`}
                onClick={() => apply((s, n) => toggleTodo(s, t.id, n))}
                className={`flex size-5 shrink-0 items-center justify-center rounded-md ring-1 ring-ring ${t.done ? "bg-primary" : ""}`}
              >
                {t.done && "✓"}
              </button>
              {editing?.id === t.id ? (
                <input
                  autoFocus
                  value={editing.text}
                  maxLength={MAX_TEXT}
                  aria-label="할 일 고치기"
                  onChange={(e) => setEditing({ id: t.id, text: e.target.value })}
                  onBlur={() => setEditing(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      apply((s) => editTodo(s, t.id, editing.text));
                      setEditing(null);
                    } else if (e.key === "Escape") setEditing(null);
                  }}
                  className="min-w-0 flex-1 rounded-md bg-bg px-2 py-1 outline-none ring-1 ring-ring"
                />
              ) : (
                <span
                  className={`min-w-0 flex-1 truncate ${t.done ? "text-muted line-through" : ""}`}
                  onDoubleClick={() => setEditing({ id: t.id, text: t.text })}
                  title="더블클릭으로 고치기"
                >
                  {t.text}
                </span>
              )}
              <span className="flex gap-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                <button type="button" aria-label="위로" onClick={() => apply((s) => moveTodo(s, t.id, -1))} className="rounded px-1 hover:bg-line">
                  ↑
                </button>
                <button type="button" aria-label="아래로" onClick={() => apply((s) => moveTodo(s, t.id, 1))} className="rounded px-1 hover:bg-line">
                  ↓
                </button>
                <button type="button" aria-label="지우기" onClick={() => apply((s, n) => removeTodo(s, t.id, n))} className="rounded px-1 hover:bg-line">
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mb-6 text-xs text-muted">Space 체크 · 더블클릭 고치기 · Delete 지우기 · Alt+↑↓ 순서 · 끝낸 일은 자정에 정리돼요</p>

      <CalendarSection now={now} />

      <section className="mb-6 rounded-2xl bg-surface-solid p-4" aria-label="인장">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold">인장</h3>
          <p className="tabular text-2xl font-semibold">{state.seals}</p>
        </div>
        <p className="mt-1 text-sm text-muted">
          {sealedToday ? "오늘의 인장을 받았어요." : `오늘 끝낸 할 일 ${Math.min(done, TODOS_PER_SEAL)}/${TODOS_PER_SEAL} · 5개를 끝내면 인장 1개 (하루 1개)`}
        </p>
      </section>

      <section aria-label="나에게 주는 상">
        <h3 className="mb-1 font-semibold">나에게 주는 상</h3>
        <p className="mb-3 text-sm text-muted">인장 {SEALS_PER_REWARD}개를 모으면 하나를 받을 수 있어요.</p>
        <form
          className="mb-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!rewardDraft.trim()) return;
            apply((s) => addReward(s, rewardDraft, newId()));
            setRewardDraft("");
          }}
        >
          <input
            value={rewardDraft}
            onChange={(e) => setRewardDraft(e.target.value)}
            maxLength={MAX_TEXT}
            placeholder="예: 케이크 먹기"
            aria-label="새 상"
            disabled={state.rewards.length >= MAX_REWARDS}
            className="h-10 flex-1 rounded-full bg-surface-solid px-4 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button type="submit" className="h-10 rounded-full bg-line px-4 text-sm font-semibold">
            적기
          </button>
        </form>
        <ul className="mb-4 flex flex-col gap-1">
          {state.rewards.map((r) => (
            <li key={r.id} className="flex items-center gap-2 rounded-xl bg-surface-solid px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{r.text}</span>
              <button
                type="button"
                disabled={state.seals < SEALS_PER_REWARD}
                onClick={() => apply((s, n) => claimReward(s, r.id, n))}
                className="h-8 rounded-full bg-primary px-3 text-xs font-semibold text-[#3b3a45] disabled:bg-line disabled:text-muted"
              >
                받기
              </button>
              <button type="button" aria-label={`${r.text} 지우기`} onClick={() => apply((s) => removeReward(s, r.id))} className="rounded px-1 hover:bg-line">
                ×
              </button>
            </li>
          ))}
        </ul>
        {state.claimed.length > 0 && (
          <>
            <h4 className="mb-1 text-xs font-semibold text-muted">받은 상</h4>
            <ul className="flex flex-col gap-1 text-xs text-muted">
              {state.claimed
                .slice(-5)
                .reverse()
                .map((c, i) => (
                  <li key={`${c.at}-${i}`}>
                    {shortDate(c.at)} · {c.text}
                  </li>
                ))}
            </ul>
          </>
        )}
      </section>
    </Drawer>
  );
}

/** 캘린더 (SPEC US-12, US-13): today's events from every connected calendar, then one row per source. */
function CalendarSection({ now }: { now: number }) {
  const gItems = useGoogle((g) => g.items);
  const nItems = useNaver((n) => n.items);
  const gStatus = useGoogle((g) => g.status);
  const nStatus = useNaver((n) => n.status);
  const gBusy = useGoogle((g) => g.busy);
  const nBusy = useNaver((n) => n.busy);
  const busy = gBusy || nBusy;
  const fetchedAt = Math.max(useGoogle((g) => g.fetchedAt) ?? 0, useNaver((n) => n.fetchedAt) ?? 0);
  const events = todayAgenda([...gItems, ...nItems], now);
  const next = nextEventId(events);
  const anyOn = gStatus === "on" || nStatus === "on";
  const time = (t: number) => new Date(t).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  return (
    <section className="mb-6 rounded-2xl bg-surface-solid p-4" aria-label="캘린더">
      <h3 className="mb-1 font-semibold">캘린더</h3>
      {anyOn ? (
        <>
          <p className="mb-2 text-sm text-muted">{fetchedAt ? `마지막 업데이트 ${time(fetchedAt)}` : "불러오는 중"}</p>
          <ul className="mb-3 flex flex-col gap-1 text-sm" aria-label="오늘 일정">
            {events.length === 0 ? (
              <li className="text-muted">오늘 남은 일정이 없어요.</li>
            ) : (
              events.map((e) => (
                <li key={e.id} className={`truncate ${e.id === next ? "font-semibold underline" : ""}`}>
                  {eventLabel(e)}
                </li>
              ))
            )}
          </ul>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              refreshAgenda();
              refreshNaver();
            }}
            className="mb-3 h-9 rounded-full bg-line px-4 text-sm font-semibold disabled:opacity-50"
          >
            새로고침
          </button>
        </>
      ) : (
        <p className="mb-3 text-sm text-muted">오늘 일정을 벽 보드에 보여줘요. 읽기만 하고 고치지 않아요.</p>
      )}
      <div className="flex flex-col gap-3">
        {googleEnabled && <GoogleRow />}
        <NaverRow />
      </div>
    </section>
  );
}

const pill = "h-9 rounded-full px-4 text-sm font-semibold";

function GoogleRow() {
  const status = useGoogle((g) => g.status);
  const [error, setError] = useState("");
  const connect = () => {
    setError("");
    connectGoogle().catch((e: Error) =>
      setError(e.message === "popup_closed" ? "" : e.message === "NO_REFRESH_TOKEN" ? "한 번만 더 눌러 주세요." : "연결하지 못했어요. 잠시 후 다시 해 주세요."),
    );
  };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-1 text-sm">Google 캘린더{status === "reconnect" && " · 연결이 끊겼어요"}</span>
        {status !== "on" && (
          <button type="button" onClick={connect} className={`${pill} bg-primary`}>
            {status === "off" ? "연결" : "다시 연결"}
          </button>
        )}
        {status !== "off" && (
          <button type="button" onClick={() => disconnectGoogle()} className={`${pill} bg-line`}>
            연결 끊기
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-muted">{error}</p>}
    </div>
  );
}

function NaverRow() {
  const status = useNaver((n) => n.status);
  const [form, setForm] = useState(false);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const input = "h-10 rounded-full bg-surface-solid px-4 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-ring";
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-1 text-sm">네이버 캘린더{status === "reconnect" && " · 연결이 끊겼어요"}</span>
        {status !== "on" && !form && (
          <button type="button" onClick={() => setForm(true)} className={`${pill} bg-primary`}>
            {status === "off" ? "연결" : "다시 연결"}
          </button>
        )}
        {status !== "off" && (
          <button type="button" onClick={() => disconnectNaver()} className={`${pill} bg-line`}>
            연결 끊기
          </button>
        )}
      </div>
      {form && status !== "on" && (
        <form
          className="mt-2 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            connectNaver(id, password)
              .then(() => {
                setForm(false);
                setPassword("");
              })
              .catch((err: Error) => setError(err.message === "AUTH" ? "아이디나 앱 비밀번호를 확인해 주세요." : "연결하지 못했어요. 잠시 후 다시 해 주세요."))
              .finally(() => setBusy(false));
          }}
        >
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="네이버 아이디" aria-label="네이버 아이디" autoComplete="username" required className={input} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="애플리케이션 비밀번호"
            aria-label="네이버 애플리케이션 비밀번호"
            autoComplete="off"
            required
            className={input}
          />
          <p className="text-xs text-muted">평소 비밀번호가 아니라 네이버 보안설정 → 2단계 인증 → 애플리케이션 비밀번호에서 만든 비밀번호예요. 이 브라우저에만 저장돼요.</p>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={`${pill} bg-primary disabled:opacity-50`}>
              {busy ? "확인 중" : "연결"}
            </button>
            <button type="button" onClick={() => setForm(false)} className={`${pill} bg-line`}>
              취소
            </button>
          </div>
          {error && <p className="text-sm text-muted">{error}</p>}
        </form>
      )}
    </div>
  );
}
