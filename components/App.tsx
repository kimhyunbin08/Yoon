"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { PIECES, PIECE_BY_ID, THEME_BY_ID, type ItemId, type Slot, type ThemeId } from "../content/catalog";
import * as game from "../lib/game";
import { initGoogle } from "../lib/google";
import { initNaver } from "../lib/naver";
import { store, useStore } from "../lib/store";
import { clearDone } from "../lib/todos";
import { Controls, Menu, TimerPill, Toasts, WindowChip, fmtDuration, useNow, type PanelId, type Toast } from "./Hud";
import { DecoratePanel, PiecesPanel, RecordsPanel, ThemesPanel, TodoPanel } from "./Panels";
import { Room } from "./Room";

const IDLE_MS = 8_000;
const PANEL_KEYS: Record<string, PanelId> = { "1": "pieces", "2": "themes", "3": "decorate", "4": "records", "5": "todos" };

export default function App() {
  const loaded = useStore((s) => s.loaded);
  const storageOk = useStore((s) => s.storageOk);
  const room = useStore((s) => s.state.room);
  const timer = useStore((s) => s.state.timer);
  const hasPieces = useStore((s) => PIECES.some((p) => s.state.pieces[p.id]) || s.state.unlockedThemes.length > 0);
  const status = game.timerStatus(timer);

  const now = useNow(30_000);
  const win = game.windowAt(now);
  const phase = game.skyPhaseAt(now);

  const [panel, setPanel] = useState<PanelId | null>(null);
  const [slot, setSlot] = useState<Slot>("wallpaper");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const panelRef = useRef(panel);
  useEffect(() => {
    panelRef.current = panel;
  }, [panel]);

  const toast = useCallback((text: string) => {
    const id = Math.random();
    setToasts((t) => [...t.slice(-3), { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const announce = useCallback(
    (drops: game.Drop[], away = false) => {
      // One toast per 5-minute drop; a catch-up of several drops collapses into one.
      if (drops.length > 2) {
        toast(`${away ? "자리를 비운 동안 " : ""}조각 ${drops.reduce((n, d) => n + d.count, 0)}개를 얻었어요`);
        return;
      }
      for (const d of drops) toast(`${PIECE_BY_ID[d.window].nameKo} ${d.count}개를 얻었어요`);
    },
    [toast],
  );

  // load once
  useEffect(() => {
    store.init();
    initGoogle();
    initNaver();
  }, []);

  // award completed blocks on open and every 10 s
  useEffect(() => {
    if (!loaded) return;
    let first = true;
    const run = () => {
      const now = Date.now();
      const r = game.tick(store.get(), now, Math.random);
      const next = clearDone(r.state, now); // finished to-dos leave the board at local midnight
      if (next !== store.get()) store.set(next);
      announce(r.drops, first);
      first = false;
    };
    run();
    const id = setInterval(run, 10_000);
    return () => clearInterval(id);
  }, [loaded, announce]);

  // theme tokens follow the clock
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.window = win;
    el.dataset.sky = phase;
  }, [win, phase]);

  const act = {
    start: () => store.set(game.start(store.get(), Date.now())),
    pause: () => store.set(game.pause(store.get(), Date.now())),
    resume: () => store.set(game.resume(store.get(), Date.now())),
    end: () => {
      const before = store.get();
      const focused = game.focusedMs(before.timer, Date.now());
      const r = game.end(before, Date.now(), Math.random);
      store.set(r.state);
      announce(r.drops);
      toast(`이번 공부 ${fmtDuration(focused)} · 조각 ${before.timer.piecesEarned + r.drops.length}개`);
    },
    unlock: (id: ThemeId) => {
      try {
        const next = game.applyTheme(game.unlock(store.get(), id), id);
        store.set(next);
        toast(`'${THEME_BY_ID[id].nameKo}' 테마를 열었어요`);
        if (next.unlockedThemes.length % 3 === 0) toast("방을 지키려면 기록에서 백업해두세요");
      } catch {
        toast("조각이 부족해요");
      }
    },
    apply: (id: ThemeId) => {
      store.set(game.applyTheme(store.get(), id));
      setPanel(null);
    },
    place: (s: Slot, id: ItemId | null) => {
      try {
        store.set(game.place(store.get(), s, id));
      } catch {
        toast("아직 열지 않은 아이템이에요");
      }
    },
    fullscreen: () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.().catch(() => {});
    },
  };
  // To-dos, 인장, and rewards: one path so 인장 changes always get a toast (SPEC US-11).
  const applyTodos = useCallback(
    (change: (s: game.State, now: number) => game.State) => {
      const before = store.get();
      let next: game.State;
      try {
        next = change(before, Date.now());
      } catch {
        toast("인장이 부족해요");
        return;
      }
      if (next === before) return;
      store.set(next);
      if (next.seals > before.seals) toast(`오늘의 인장을 받았어요 · 인장 ${next.seals}개`);
      else if (next.claimed.length > before.claimed.length) toast(`'${next.claimed.at(-1)!.text}' 상을 받았어요`);
      else if (next.seals < before.seals) toast("오늘 끝낸 할 일이 5개 아래로 줄어서 인장을 돌려놓았어요");
    },
    [toast],
  );

  const actRef = useRef(act);
  useEffect(() => {
    actRef.current = act;
  });

  const togglePanel = useCallback((p: PanelId) => setPanel((cur) => (cur === p ? null : p)), []);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select") || e.metaKey || e.ctrlKey || e.altKey) return;
      const a = actRef.current;
      if (e.key === "Escape") return setPanel(null);
      if (e.key === "f" || e.key === "F") return a.fullscreen();
      if (PANEL_KEYS[e.key]) return togglePanel(PANEL_KEYS[e.key]);
      if (e.code === "Space" && !t.closest("button")) {
        e.preventDefault();
        const s = game.timerStatus(store.get().timer);
        (s === "idle" ? a.start : s === "running" ? a.pause : a.resume)();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePanel]);

  // ambient mode: fade UI after idle
  useEffect(() => {
    const el = document.documentElement;
    let timeout: ReturnType<typeof setTimeout>;
    const wake = () => {
      el.removeAttribute("data-idle");
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (!panelRef.current) el.setAttribute("data-idle", "");
      }, IDLE_MS);
    };
    const events = ["mousemove", "mousedown", "keydown", "wheel"] as const;
    events.forEach((ev) => window.addEventListener(ev, wake, { passive: true }));
    wake();
    return () => {
      clearTimeout(timeout);
      events.forEach((ev) => window.removeEventListener(ev, wake));
    };
  }, []);

  // keep the screen awake while studying
  useEffect(() => {
    if (status !== "running" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const request = () => {
      if (document.visibilityState === "visible") navigator.wakeLock.request("screen").then((l) => (lock = l)).catch(() => {});
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      document.removeEventListener("visibilitychange", request);
      lock?.release().catch(() => {});
    };
  }, [status]);

  // offline launch for the installed app
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  if (!loaded) return <main className="h-dvh w-screen bg-bg" />;

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-bg">
      <Room
        room={room}
        phase={phase}
        highlight={panel === "decorate" ? slot : undefined}
        onSlot={setSlot}
        onBoard={() => setPanel("todos")}
        className="absolute inset-0 h-full w-full"
      />

      {!storageOk && (
        <p className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-pink px-4 py-2 text-sm text-[#3b3a45]">
          이 모드에서는 기록이 저장되지 않아요
        </p>
      )}

      <WindowChip now={now} />
      <TimerPill />
      <Menu active={panel} onOpen={togglePanel} />

      {panel !== "decorate" && (
        <>
          {status === "idle" && !hasPieces && (
            <p className="ui-fade absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-surface px-4 py-2 text-sm text-muted backdrop-blur">
              5분마다 조각이 1~5개 나와요
            </p>
          )}
          <Controls status={status} onStart={act.start} onPause={act.pause} onResume={act.resume} onEnd={act.end} onFullscreen={act.fullscreen} />
        </>
      )}

      {panel === "pieces" && <PiecesPanel now={now} onClose={() => setPanel(null)} />}
      {panel === "themes" && <ThemesPanel phase={phase} onUnlock={act.unlock} onApply={act.apply} onClose={() => setPanel(null)} />}
      {panel === "decorate" && <DecoratePanel slot={slot} onSlot={setSlot} onPlace={act.place} onClose={() => setPanel(null)} />}
      {panel === "todos" && <TodoPanel now={now} apply={applyTodos} onClose={() => setPanel(null)} />}
      {panel === "records" && (
        <RecordsPanel
          now={now}
          onClose={() => setPanel(null)}
          onImport={(s) => {
            store.set(s);
            toast("백업을 불러왔어요");
          }}
        />
      )}

      <Toasts items={toasts} />
    </main>
  );
}
