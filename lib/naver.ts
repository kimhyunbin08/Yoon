"use client";
// Naver Calendar connection (SPEC US-13, D22): her id + app password, today's events through /api/naver/caldav.
import { del, get, set } from "idb-keyval";
import { useSyncExternalStore } from "react";
import type { CalItem } from "./calendar";

const KEY = "naver"; // kept apart from State: a credential never goes into the backup file
const REFRESH_MS = 15 * 60_000;

type Saved = { id: string; password: string; items: CalItem[]; fetchedAt: number };
type Snap = { status: "off" | "on" | "reconnect"; items: CalItem[]; fetchedAt: number | null; busy: boolean };

const off: Snap = { status: "off", items: [], fetchedAt: null, busy: false };
let snap = off;
let saved: Saved | null = null;
const listeners = new Set<() => void>();
const emit = (next: Partial<Snap>) => {
  snap = { ...snap, ...next };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useNaver<T>(select: (s: Snap) => T): T {
  return useSyncExternalStore(subscribe, () => select(snap), () => select(off));
}

/** Throws AUTH (wrong id/password) or FETCH_FAILED. */
async function fetchToday(id: string, password: string): Promise<CalItem[]> {
  const now = new Date();
  const res = await fetch("/api/naver/caldav", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XmlHttpRequest" },
    body: JSON.stringify({
      id,
      password,
      timeMin: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
      timeMax: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString(),
    }),
  });
  if (res.status === 401) throw new Error("AUTH");
  if (!res.ok) throw new Error("FETCH_FAILED");
  const { items } = (await res.json()) as { items: CalItem[] };
  return items.map((it) => ({ ...it, id: `naver:${it.id}` }));
}

/** Offline or failing: keeps the last agenda. */
export async function refreshNaver() {
  if (!saved || snap.busy) return;
  emit({ busy: true });
  try {
    saved = { ...saved, items: await fetchToday(saved.id, saved.password), fetchedAt: Date.now() };
    await set(KEY, saved).catch(() => {});
    emit({ status: "on", items: saved.items, fetchedAt: saved.fetchedAt });
  } catch (e) {
    if ((e as Error).message === "AUTH") emit({ status: "reconnect" });
  } finally {
    emit({ busy: false });
  }
}

let started = false;
export async function initNaver() {
  if (started) return;
  started = true;
  setInterval(refreshNaver, REFRESH_MS); // no-op until connected
  saved = ((await get(KEY).catch(() => undefined)) as Saved | undefined) ?? null;
  if (!saved) return;
  emit({ status: "on", items: saved.items, fetchedAt: saved.fetchedAt });
  refreshNaver();
}

/** Checks the id and app password by fetching today once; saves them only if that works. */
export async function connectNaver(id: string, password: string) {
  const items = await fetchToday(id.trim(), password.trim());
  saved = { id: id.trim(), password: password.trim(), items, fetchedAt: Date.now() };
  await set(KEY, saved);
  emit({ status: "on", items, fetchedAt: saved.fetchedAt });
}

export async function disconnectNaver() {
  saved = null;
  await del(KEY).catch(() => {});
  emit(off);
}
