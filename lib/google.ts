"use client";
// Google Calendar connection (SPEC US-12, D21): GIS sign-in popup, token renewal through
// /api/google/token, read-only Calendar fetch, and a tiny store for the board.
import { del, get, set } from "idb-keyval";
import { useSyncExternalStore } from "react";
import type { CalItem } from "./calendar";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
export const googleEnabled = !!CLIENT_ID;
const SCOPES = "https://www.googleapis.com/auth/calendar.calendarlist.readonly https://www.googleapis.com/auth/calendar.events.readonly";
const KEY = "google"; // kept apart from State: a credential never goes into the backup file
const REFRESH_MS = 15 * 60_000;

type Saved = { refreshToken: string; items: CalItem[]; fetchedAt: number };
type Snap = { status: "off" | "on" | "reconnect"; items: CalItem[]; fetchedAt: number | null; busy: boolean };

type Gis = {
  accounts: {
    oauth2: {
      initCodeClient(cfg: {
        client_id: string;
        scope: string;
        ux_mode: "popup";
        callback: (r: { code?: string; error?: string }) => void;
        error_callback?: (e: { type: string }) => void;
      }): { requestCode(): void };
      revoke(token: string, done?: () => void): void;
    };
  };
};
declare global {
  interface Window {
    google?: Gis;
  }
}

const off: Snap = { status: "off", items: [], fetchedAt: null, busy: false };
let snap = off;
let saved: Saved | null = null;
let access: { token: string; until: number } | null = null;
const listeners = new Set<() => void>();
const emit = (next: Partial<Snap>) => {
  snap = { ...snap, ...next };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useGoogle<T>(select: (s: Snap) => T): T {
  return useSyncExternalStore(subscribe, () => select(snap), () => select(off));
}

async function exchange(body: { code: string } | { refresh_token: string }) {
  const res = await fetch("/api/google/token", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XmlHttpRequest" },
    body: JSON.stringify(body),
  });
  if (res.status === 400) throw new Error("RECONNECT");
  if (!res.ok) throw new Error("TOKEN_FAILED");
  return (await res.json()) as { access_token: string; expires_in: number; refresh_token?: string };
}

async function accessToken(): Promise<string> {
  if (access && access.until > Date.now()) return access.token;
  if (!saved) throw new Error("RECONNECT");
  const t = await exchange({ refresh_token: saved.refreshToken });
  access = { token: t.access_token, until: Date.now() + (t.expires_in - 60) * 1000 };
  return access.token;
}

async function api<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = `https://www.googleapis.com/calendar/v3/${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${await accessToken()}` } });
  if (res.status === 401) access = null;
  if (!res.ok) throw new Error(res.status === 401 || res.status === 403 ? "RECONNECT" : "FETCH_FAILED");
  return res.json() as Promise<T>;
}

/** Today's events from every calendar she has checked in Google Calendar. Offline or failing: keeps the last agenda. */
export async function refreshAgenda() {
  if (!saved || snap.busy) return;
  emit({ busy: true });
  try {
    const now = new Date();
    const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    const list = await api<{ items?: { id: string; selected?: boolean }[] }>("users/me/calendarList");
    const cals = (list.items ?? []).filter((c) => c.selected);
    const pages = await Promise.all(
      cals.map((c) =>
        api<{ items?: CalItem[] }>(`calendars/${encodeURIComponent(c.id)}/events`, { timeMin, timeMax, singleEvents: "true", orderBy: "startTime", maxResults: "50" }),
      ),
    );
    saved = { ...saved, items: pages.flatMap((p) => p.items ?? []), fetchedAt: Date.now() };
    await set(KEY, saved).catch(() => {});
    emit({ status: "on", items: saved.items, fetchedAt: saved.fetchedAt });
  } catch (e) {
    if ((e as Error).message === "RECONNECT") emit({ status: "reconnect" });
  } finally {
    emit({ busy: false });
  }
}

function loadGis(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("GIS_LOAD_FAILED"));
    document.head.appendChild(s);
  });
}

let started = false;
/** Restores the saved connection, preloads the sign-in script, and refreshes every 15 min. */
export async function initGoogle() {
  if (!googleEnabled || started) return;
  started = true;
  loadGis().catch(() => {});
  setInterval(refreshAgenda, REFRESH_MS); // no-op until connected
  saved = ((await get(KEY).catch(() => undefined)) as Saved | undefined) ?? null;
  if (!saved) return;
  emit({ status: "on", items: saved.items, fetchedAt: saved.fetchedAt });
  refreshAgenda();
}

/** Opens Google's sign-in popup. Must run inside a click so the popup isn't blocked. */
export function connectGoogle(): Promise<void> {
  const gis = window.google;
  if (!CLIENT_ID || !gis) return Promise.reject(new Error("GIS_NOT_READY"));
  return new Promise((resolve, reject) => {
    gis.accounts.oauth2
      .initCodeClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        ux_mode: "popup",
        callback: async (r) => {
          try {
            if (!r.code) throw new Error(r.error ?? "DENIED");
            const t = await exchange({ code: r.code });
            // Google only sends a refresh token on a fresh consent; disconnect revokes, so reconnecting consents again.
            if (!t.refresh_token) {
              // An older grant is still live (e.g. site data was cleared): drop it so the next try consents afresh.
              gis.accounts.oauth2.revoke(t.access_token);
              throw new Error("NO_REFRESH_TOKEN");
            }
            access = { token: t.access_token, until: Date.now() + (t.expires_in - 60) * 1000 };
            saved = { refreshToken: t.refresh_token, items: [], fetchedAt: 0 };
            await set(KEY, saved);
            emit({ status: "on" });
            await refreshAgenda();
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        error_callback: (e) => reject(new Error(e.type)),
      })
      .requestCode();
  });
}

export async function disconnectGoogle() {
  if (saved) window.google?.accounts.oauth2.revoke(saved.refreshToken);
  saved = null;
  access = null;
  await del(KEY).catch(() => {});
  emit(off);
}
