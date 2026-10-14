import { describe, expect, it } from "vitest";
import { eventLabel, nextEventId, todayAgenda, type CalItem } from "./calendar";

const at = (h: number, m = 0, day = 14) => new Date(2026, 9, day, h, m).getTime();
const iso = (h: number, m = 0, day = 14) => new Date(at(h, m, day)).toISOString();
const timed = (id: string, h1: number, h2: number, day = 14): CalItem => ({
  id,
  summary: id,
  start: { dateTime: iso(h1, 0, day) },
  end: { dateTime: iso(h2, 0, day) },
});

describe("todayAgenda", () => {
  it("keeps today's events that haven't ended, all-day first, by start", () => {
    const items: CalItem[] = [
      timed("late", 18, 19),
      timed("done", 9, 10),
      timed("now", 13, 15),
      timed("tomorrow", 9, 10, 15),
      { id: "trip", summary: "가족 여행", start: { date: "2026-10-13" }, end: { date: "2026-10-16" } },
      { id: "yesterday", start: { date: "2026-10-13" }, end: { date: "2026-10-14" } },
      { ...timed("gone", 16, 17), status: "cancelled" },
    ];
    expect(todayAgenda(items, at(14)).map((e) => e.id)).toEqual(["trip", "now", "late"]);
  });

  it("labels and picks the next event", () => {
    const events = todayAgenda([timed("영어 스터디", 14, 15), { id: "x", start: { date: "2026-10-14" }, end: { date: "2026-10-15" } }], at(9));
    expect(events.map(eventLabel)).toEqual(["종일 (제목 없음)", "14:00 영어 스터디"]);
    expect(nextEventId(events)).toBe("영어 스터디");
    expect(nextEventId([])).toBeNull();
  });
});
