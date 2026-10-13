"use client";
import { useRef, useState, type ReactNode } from "react";
import {
  ITEMS,
  PIECES,
  PIECE_BY_ID,
  RARITY_KO,
  SLOTS,
  SLOT_KO,
  THEMES,
  THEME_BY_ID,
  WINDOWS,
  WINDOW_INFO,
  type ItemId,
  type PieceId,
  type SkyPhase,
  type Slot,
  type ThemeId,
} from "../content/catalog";
import { dayKey, missingFor, studiedOn, windowAt, type State } from "../lib/game";
import { exportBackup, readBackup, useStore } from "../lib/store";
import { PieceIcon } from "./art/pieces";
import { Icon, fmtDuration } from "./Hud";
import { Room } from "./Room";

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <aside role="dialog" aria-label={title} className="absolute inset-y-0 right-0 flex w-[440px] max-w-full flex-col bg-surface shadow-[0_4px_32px_rgb(59_58_69/0.14)] backdrop-blur-md">
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

const rarityRing = { common: "ring-line", rare: "ring-rare", special: "ring-special" } as const;
const hours = (w: keyof typeof WINDOW_INFO) => `${WINDOW_INFO[w].from}시–${WINDOW_INFO[w].to}시`;

export function PiecesPanel({ now, onClose }: { now: number; onClose: () => void }) {
  const pieces = useStore((s) => s.state.pieces);
  const [tab, setTab] = useState(() => windowAt(now));
  const [selected, setSelected] = useState<PieceId | null>(null);
  const owned = PIECES.filter((p) => pieces[p.id]).length;
  const sel = selected ? PIECE_BY_ID[selected] : null;

  return (
    <Drawer title="조각함" onClose={onClose}>
      <p className="mb-4 text-sm text-muted">모은 종류 {owned} / {PIECES.length}</p>
      <div role="tablist" className="mb-4 grid grid-cols-4 gap-1 rounded-full bg-line p-1">
        {WINDOWS.map((w) => (
          <button
            key={w}
            role="tab"
            type="button"
            aria-selected={tab === w}
            onClick={() => setTab(w)}
            className={`h-9 rounded-full text-sm ${tab === w ? "bg-surface-solid font-semibold shadow" : "text-muted"}`}
          >
            {WINDOW_INFO[w].nameKo}
          </button>
        ))}
      </div>
      <p className="mb-3 text-xs text-muted">{hours(tab)}에 공부하면 나와요</p>
      <div className="grid grid-cols-3 gap-3">
        {PIECES.filter((p) => p.window === tab).map((p) => {
          const n = pieces[p.id] ?? 0;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              aria-pressed={selected === p.id}
              className={`relative flex flex-col items-center gap-1 rounded-2xl bg-surface-solid p-3 ring-2 ${n ? rarityRing[p.rarity] : "ring-transparent"} ${selected === p.id ? "outline outline-2 outline-primary" : ""}`}
            >
              <PieceIcon id={p.id} size={56} locked={!n} />
              <span className="text-xs">{n ? p.nameKo : "???"}</span>
              {n > 0 && <span className="tabular absolute right-2 top-2 text-xs text-muted">×{n}</span>}
            </button>
          );
        })}
      </div>
      {sel && (
        <div className="mt-5 flex items-center gap-4 rounded-2xl bg-surface-solid p-4">
          <PieceIcon id={sel.id} size={72} locked={!pieces[sel.id]} />
          <div className="text-sm">
            <p className="font-semibold">{pieces[sel.id] ? sel.nameKo : "아직 없는 조각"}</p>
            <p className="text-muted">
              {RARITY_KO[sel.rarity]} · {WINDOW_INFO[sel.window].nameKo} {hours(sel.window)}
            </p>
            <p className="mt-1 text-muted">
              쓰이는 테마: {THEMES.filter((t) => sel.id in t.recipe).map((t) => t.nameKo).join(", ") || "없음"}
            </p>
          </div>
        </div>
      )}
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
                          title={`${p.nameKo} · ${WINDOW_INFO[p.window].nameKo}`}
                          className={`flex items-center gap-1 rounded-full py-1 pl-1 pr-3 text-xs ${have >= qty ? "bg-mint/50" : "bg-line"}`}
                        >
                          <PieceIcon id={p.id} size={22} locked={have === 0} />
                          <span className="tabular">
                            {have}/{qty}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {!unlocked && missing.length > 0 && (
                  <p className="mb-3 text-xs text-muted">
                    부족: {missing.map((m) => `${WINDOW_INFO[PIECE_BY_ID[m.pieceId].window].nameKo} ${PIECE_BY_ID[m.pieceId].nameKo} ${m.need}`).join(" · ")}
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
        <div role="tablist" className="flex gap-1">
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
          className={`flex h-20 w-36 shrink-0 items-center justify-center rounded-2xl bg-surface-solid text-sm ring-2 ${!state.room[slot] ? "ring-primary" : "ring-transparent"}`}
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
              className={`flex h-20 w-44 shrink-0 flex-col items-start justify-center rounded-2xl bg-surface-solid px-4 text-left text-sm ring-2 disabled:opacity-50 ${on ? "ring-primary" : "ring-transparent"}`}
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
                className={`w-full rounded-t-lg ${i === 6 ? "bg-primary" : "bg-pink"}`}
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

