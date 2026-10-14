// Pure iCalendar VEVENT parser (SPEC §3.2, D22): turns CalDAV calendar-data into the Google item shape. No I/O.
import type { CalItem } from "./calendar";

type Prop = { params: Record<string, string>; value: string };

const unescape = (v: string) => v.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1");

/** Wall-clock time in `tz` → epoch ms (two passes cover DST edges). */
function zonedToUtc(y: number, mo: number, d: number, h: number, mi: number, s: number, tz: string): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const offset = (t: number) => {
    const p = Object.fromEntries(fmt.formatToParts(t).map((x) => [x.type, Number(x.value)]));
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - t;
  };
  const first = guess - offset(guess);
  return guess - offset(first);
}

/** DTSTART/DTEND → Google's { date } or { dateTime }. Floating times stay local (no zone suffix). */
function toTime(p: Prop): { date?: string; dateTime?: string } | null {
  const m = p.value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  if (!h || p.params.VALUE === "DATE") return { date: `${y}-${mo}-${d}` };
  if (z) return { dateTime: `${y}-${mo}-${d}T${h}:${mi}:${s}Z` };
  const tz = p.params.TZID?.replace(/^"|"$/g, "");
  if (tz) {
    try {
      return { dateTime: new Date(zonedToUtc(+y, +mo, +d, +h, +mi, +s, tz)).toISOString() };
    } catch {
      // unknown zone name: fall through to floating
    }
  }
  return { dateTime: `${y}-${mo}-${d}T${h}:${mi}:${s}` };
}

/** Every VEVENT in one or more VCALENDAR texts. Events without an end last 1 h (timed) or 1 day (all-day). */
export function parseEvents(ics: string): CalItem[] {
  const lines = ics.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const out: CalItem[] = [];
  let ev: Record<string, Prop> | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") ev = {};
    else if (line === "END:VEVENT" && ev) {
      const start = ev.DTSTART && toTime(ev.DTSTART);
      if (start) {
        let end = ev.DTEND && toTime(ev.DTEND);
        if (!end && start.date) {
          const d = new Date(`${start.date}T00:00:00Z`);
          d.setUTCDate(d.getUTCDate() + 1);
          end = { date: d.toISOString().slice(0, 10) };
        } else if (!end) end = { dateTime: new Date(Date.parse(start.dateTime!) + 3_600_000).toISOString() };
        out.push({
          id: `${ev.UID?.value ?? out.length}@${ev["RECURRENCE-ID"]?.value ?? ev.DTSTART.value}`,
          summary: ev.SUMMARY ? unescape(ev.SUMMARY.value) : undefined,
          status: ev.STATUS?.value === "CANCELLED" ? "cancelled" : undefined,
          start,
          end,
        });
      }
      ev = null;
    } else if (ev) {
      const colon = line.indexOf(":");
      if (colon < 0) continue;
      const [name, ...rest] = line.slice(0, colon).split(";");
      const params = Object.fromEntries(rest.map((r) => r.split("=") as [string, string]));
      const key = name.toUpperCase();
      if (!(key in ev)) ev[key] = { params, value: line.slice(colon + 1) };
    }
  }
  return out;
}
