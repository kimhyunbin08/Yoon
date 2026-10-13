"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { PIECES, PIECE_BY_ID, RARITY_KO, THEME_BY_ID, WINDOW_INFO, type ItemId, type Slot, type ThemeId } from "../content/catalog";
import * as game from "../lib/game";
import { store, useStore } from "../lib/store";
import { Controls, Menu, TimerPill, Toasts, WindowChip, fmtDuration, useNow, type PanelId, type Toast } from "./Hud";
import { DecoratePanel, PiecesPanel, RecordsPanel, ThemesPanel } from "./Panels";
import { Room } from "./Room";

const IDLE_MS = 8_000;
const PANEL_KEYS: Record<string, PanelId> = { "1": "pieces", "2": "themes", "3": "decorate", "4": "records" };

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
  const [slot, setSlot] = useState<Slot>("window");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const panelRef = useRef(panel);
  useEffect(() => {
    panelRef.current = panel;
  }, [panel]);

  const toast = useCallback((text: string, tone?: Toast["tone"]) => {
    const id = Math.random();
    setToasts((t) => [...t.slice(-3), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const announce = useCallback(
    (drops: game.Drop[], away = false) => {
      // One toast per 5-minute drop; a catch-up of several drops collapses into one.
      const groups = Map.groupBy(drops, (d) => d.at);
      if (groups.size > 2) {
        toast(`${away ? "자리를 비운 동안 " : ""}조각 ${drops.length}개를 얻었어요`);
        return;
      }
      for (const group of groups.values()) {
        const names = Map.groupBy(group, (d) => d.pieceId);
        const list = [...names].map(([id, ds]) => {
          const tag = ds[0].rarity === "common" ? "" : `(${RARITY_KO[ds[0].rarity]})`;
          return `${PIECE_BY_ID[id].nameKo}${tag}${ds.length > 1 ? ` ×${ds.length}` : ""}`;
        });
        const tone = group.some((d) => d.rarity === "special") ? "special" : group.some((d) => d.rarity === "rare") ? "rare" : undefined;
        toast(`${WINDOW_INFO[group[0].window].nameKo} 조각 ${group.length}개 · ${list.join(", ")}`, tone);
      }
    },
    [toast],
  );

  // load once
  useEffect(() => {
    store.init();
  }, []);

  // award completed blocks on open and every 10 s
  useEffect(() => {
    if (!loaded) return;
    let first = true;
    const run = () => {
      const r = game.tick(store.get(), Date.now(), Math.random);
      if (r.state !== store.get()) store.set(r.state);
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
      toast(`이번 공부 ${fmtDuration(focused)}`);
    },
    unlock: (id: ThemeId) => {
      try {
        const next = game.applyTheme(game.unlock(store.get(), id), id);
        store.set(next);
        toast(`'${THEME_BY_ID[id].nameKo}' 테마를 열었어요`, "special");
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
