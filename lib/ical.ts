// Pure iCalendar VEVENT parser (SPEC §3.2, D22): turns CalDAV calendar-data into the Google item shape,
// expanding recurring events into the requested window when the server didn't. No I/O.
import type { CalItem } from "./calendar";

type Prop = { params: Record<string, string>; value: string };
type VEvent = { props: Record<string, Prop>; exdates: string[] };
type Wall = { y: number; m: number; d: number; h: number; mi: number; s: number; allDay: boolean; tz: string };

const DAY = 86_400_000;
const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

const unescape = (v: string) => v.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1");
const pad = (n: number, w = 2) => String(n).padStart(w, "0");
const dayNum = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d) / DAY;
const fromDayNum = (n: number) => {
  const t = new Date(n * DAY);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
};

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function partsIn(t: number, tz: string) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    fmtCache.set(tz, f);
  }
  const p = Object.fromEntries(f.formatToParts(t).map((x) => [x.type, Number(x.value)]));
  return { y: p.year, m: p.month, d: p.day, h: p.hour, mi: p.minute, s: p.second };
}

/** Wall-clock time in `tz` → epoch ms (two passes cover DST edges). */
function zonedToUtc(w: Omit<Wall, "allDay" | "tz">, tz: string): number {
  const guess = Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi, w.s);
  const offset = (t: number) => {
    const p = partsIn(t, tz);
    return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - t;
  };
  return guess - offset(guess - offset(guess));
}

const validTz = (tz: string | undefined) => {
  if (!tz) return false;
  try {
    partsIn(0, tz);
    return true;
  } catch {
    return false;
  }
};

/** DTSTART/DTEND → wall-clock parts and the zone they are in. Floating times use `fallbackTz` (hers). */
function wall(p: Prop | undefined, fallbackTz: string): Wall | null {
  const m = p?.value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!p || !m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  const allDay = !h || p.params.VALUE === "DATE";
  const tzid = p.params.TZID?.replace(/^"|"$/g, "");
  const tz = z ? "UTC" : validTz(tzid) ? tzid! : fallbackTz;
  return { y: +y, m: +mo, d: +d, h: allDay ? 0 : +h, mi: allDay ? 0 : +mi, s: allDay ? 0 : +s, allDay, tz };
}

const instant = (w: Wall) => zonedToUtc(w, w.tz);
const dateStr = (w: { y: number; m: number; d: number }) => `${w.y}-${pad(w.m)}-${pad(w.d)}`;
const timeOf = (w: Wall) => (w.allDay ? { date: dateStr(w) } : { dateTime: new Date(instant(w)).toISOString() });

function readEvents(ics: string): VEvent[] {
  const lines = ics.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const out: VEvent[] = [];
  let ev: VEvent | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") ev = { props: {}, exdates: [] };
    else if (line === "END:VEVENT" && ev) {
      out.push(ev);
      ev = null;
    } else if (ev) {
      const colon = line.indexOf(":");
      if (colon < 0) continue;
      const [name, ...rest] = line.slice(0, colon).split(";");
      const key = name.toUpperCase();
      const value = line.slice(colon + 1);
      if (key === "EXDATE") ev.exdates.push(...value.split(",").map((v) => v.slice(0, 8)));
      else if (!(key in ev.props)) ev.props[key] = { params: Object.fromEntries(rest.map((r) => r.split("=") as [string, string])), value };
    }
  }
  return out;
}

/** Does the RRULE produce an occurrence on day `dn` (a day number in the event's zone)? */
function ruleMatcher(rrule: string, start: Wall) {
  const r = Object.fromEntries(rrule.split(";").map((kv) => kv.split("=") as [string, string]));
  const interval = Number(r.INTERVAL) || 1;
  const sDay = dayNum(start.y, start.m, start.d);
  const until = r.UNTIL?.match(/^(\d{4})(\d{2})(\d{2})/);
  const untilDay = until ? dayNum(+until[1], +until[2], +until[3]) : Infinity;
  const byDay = r.BYDAY?.split(",") ?? [];
  const week = (dn: number) => Math.floor((dn + 3) / 7); // Monday-based weeks (WKST=MO)
  const matches = (dn: number) => {
    if (dn < sDay || dn > untilDay) return false;
    const { y, m, d } = fromDayNum(dn);
    const wd = WEEKDAYS[new Date(dn * DAY).getUTCDay()];
    const months = y * 12 + m - (start.y * 12 + start.m);
    switch (r.FREQ) {
      case "DAILY":
        return (dn - sDay) % interval === 0 && (byDay.length === 0 || byDay.includes(wd));
      case "WEEKLY":
        return (week(dn) - week(sDay)) % interval === 0 && (byDay.length ? byDay.includes(wd) : wd === WEEKDAYS[new Date(sDay * DAY).getUTCDay()]);
      case "MONTHLY": {
        if (months % interval !== 0) return false;
        if (byDay.length) {
          const dim = fromDayNum(dayNum(y, m + 1, 1) - 1).d;
          return byDay.some((b) => {
            const [, n, code] = b.match(/^([+-]?\d+)?(\w\w)$/) ?? [];
            if (code !== wd) return false;
            const nth = Number(n ?? 0);
            return nth === 0 || (nth > 0 ? Math.ceil(d / 7) === nth : Math.ceil((dim - d + 1) / 7) === -nth);
          });
        }
        return d === (Number(r.BYMONTHDAY) || start.d);
      }
      case "YEARLY":
        return (y - start.y) % interval === 0 && m === (Number(r.BYMONTH) || start.m) && d === (Number(r.BYMONTHDAY) || start.d);
      default:
        return false;
    }
  };
  const count = Number(r.COUNT) || 0;
  return (dn: number) => {
    if (!matches(dn)) return false;
    if (!count) return true;
    // ponytail: counts occurrences day by day from the start; fine for personal calendars (≤ decades).
    let n = 0;
    for (let x = sDay; x <= dn; x++) if (matches(x) && ++n > count) return false;
    return true;
  };
}

/**
 * Every VEVENT in one or more VCALENDAR texts. Events without an end last 1 h (timed) or 1 day (all-day).
 * With a window, recurring masters become their occurrences in [windowStart, windowEnd) (`tz` = her zone).
 */
export function parseEvents(ics: string, window?: { start: number; end: number; tz: string }): CalItem[] {
  const tz = window && validTz(window.tz) ? window.tz : "Asia/Seoul";
  const events = readEvents(ics);
  const overridden = new Set(
    events.filter((e) => e.props["RECURRENCE-ID"]).map((e) => `${e.props.UID?.value}@${e.props["RECURRENCE-ID"].value.slice(0, 8)}`),
  );
  const out: CalItem[] = [];
  events.forEach((ev, i) => {
    const p = ev.props;
    const start = wall(p.DTSTART, tz);
    if (!start) return;
    const end = wall(p.DTEND, tz);
    const length = start.allDay
      ? Math.max(1, end ? dayNum(end.y, end.m, end.d) - dayNum(start.y, start.m, start.d) : 1) * DAY
      : end
        ? instant(end) - instant(start)
        : 3_600_000;
    const uid = p.UID?.value ?? String(i);
    const base = { summary: p.SUMMARY ? unescape(p.SUMMARY.value) : undefined, status: p.STATUS?.value === "CANCELLED" ? "cancelled" : undefined };
    const item = (s: Wall, key: string): CalItem => {
      const e = start.allDay ? fromDayNum(dayNum(s.y, s.m, s.d) + length / DAY) : null;
      return {
        id: `${uid}@${key}`,
        ...base,
        start: timeOf(s),
        end: e ? { date: dateStr(e) } : { dateTime: new Date(instant(s) + length).toISOString() },
      };
    };

    if (!p.RRULE || !window || p["RECURRENCE-ID"]) {
      out.push(item(start, p["RECURRENCE-ID"]?.value ?? p.DTSTART.value));
      return;
    }
    const matches = ruleMatcher(p.RRULE.value, start);
    // Candidate days in the event's zone: from (window start − length) to window end.
    const zone = start.allDay ? tz : start.tz;
    const lo = partsIn(window.start - length, zone);
    const hi = partsIn(window.end, zone);
    for (let dn = dayNum(lo.y, lo.m, lo.d); dn <= dayNum(hi.y, hi.m, hi.d); dn++) {
      const { y, m, d } = fromDayNum(dn);
      const key = `${y}${pad(m)}${pad(d)}`;
      if (!matches(dn) || ev.exdates.includes(key) || overridden.has(`${uid}@${key}`)) continue;
      const occ: Wall = { ...start, y, m, d };
      const s = start.allDay ? zonedToUtc(occ, tz) : instant(occ);
      if (s < window.end && s + length > window.start) out.push(item(occ, key));
    }
  });
  return out;
}
