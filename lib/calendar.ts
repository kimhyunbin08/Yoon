// Pure agenda helpers (SPEC US-12): today's events from Google Calendar API items. No I/O.

/** The fields we read from a Calendar API event resource. */
export type CalItem = {
  id: string;
  summary?: string;
  status?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
};

export type AgendaEvent = { id: string; title: string; allDay: boolean; start: number; end: number };

const localDate = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
};

/** Today's events that haven't ended: all-day first, then by start time. */
export function todayAgenda(items: CalItem[], now: number): AgendaEvent[] {
  const d = new Date(now);
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
  const out: AgendaEvent[] = [];
  for (const it of items) {
    if (it.status === "cancelled" || !it.start || !it.end) continue;
    const allDay = !!it.start.date;
    const start = allDay ? localDate(it.start.date!) : Date.parse(it.start.dateTime ?? "");
    const end = allDay ? localDate(it.end.date ?? it.start.date!) : Date.parse(it.end.dateTime ?? "");
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    const today = allDay ? start < dayEnd && end > dayStart : start < dayEnd && end > now;
    if (today) out.push({ id: it.id, title: it.summary?.trim() || "(제목 없음)", allDay, start, end });
  }
  return out.sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start - b.start);
}

/** "14:00 영어 스터디" or "종일 가족 여행". */
export function eventLabel(e: AgendaEvent): string {
  if (e.allDay) return `종일 ${e.title}`;
  const t = new Date(e.start);
  return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")} ${e.title}`;
}

/** The event to underline: the first timed one still to come or under way. */
export function nextEventId(events: AgendaEvent[]): string | null {
  return events.find((e) => !e.allDay)?.id ?? null;
}
