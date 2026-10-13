"use client";
import { get, set } from "idb-keyval";
import { useSyncExternalStore } from "react";
import { dayKey, initialState, migrate, type State } from "./game";

const KEY = "state";

type Snapshot = { state: State; loaded: boolean; storageOk: boolean };

const serverSnapshot: Snapshot = { state: initialState(), loaded: false, storageOk: true };
let snapshot = serverSnapshot;
const listeners = new Set<() => void>();

function emit(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((l) => l());
}

export const store = {
  get: () => snapshot.state,

  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },

  /** Replaces state and persists it. Writes are rare (user actions, drops), so no debounce. */
  set(state: State) {
    emit({ state });
    set(KEY, state).catch(() => emit({ storageOk: false }));
  },

  async init() {
    if (snapshot.loaded) return;
    try {
      const raw = await get(KEY);
      let state = initialState();
      if (raw !== undefined) {
        try {
          state = migrate(raw);
        } catch {
          // Keep the unreadable copy instead of silently destroying it.
          await set(`${KEY}-corrupt-${Date.now()}`, raw);
        }
      }
      navigator.storage?.persist?.().catch(() => {});
      emit({ state, loaded: true });
    } catch {
      emit({ loaded: true, storageOk: false });
    }
  },
};

export function useStore<T>(select: (s: Snapshot) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => select(snapshot),
    () => select(serverSnapshot),
  );
}

export function exportBackup(state: State) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `jogakbang-backup-${dayKey(Date.now())}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Throws INVALID_STATE on a bad file. */
export async function readBackup(file: File): Promise<State> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("INVALID_STATE");
  }
  return migrate(parsed);
}
