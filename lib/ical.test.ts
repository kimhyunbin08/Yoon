import { describe, expect, it } from "vitest";
import { todayAgenda } from "./calendar";
import { parseEvents } from "./ical";

const ics = [
  "BEGIN:VCALENDAR",
  "BEGIN:VTIMEZONE",
  "TZID:Asia/Seoul",
  "END:VTIMEZONE",
  "BEGIN:VEVENT",
  "UID:a1",
  "DTSTART;TZID=Asia/Seoul:20261014T140000",
  "DTEND;TZID=Asia/Seoul:20261014T150000",
  "SUMMARY:영어 스터디\\, 2층",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:a2",
  "DTSTART;VALUE=DATE:20261014",
  "SUMMARY:엄마 생신 저녁 약속이 있는 날이라 길게 적어 둔 아주 긴 제",
  " 목",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:a3",
  "RECURRENCE-ID:20261014T000000Z",
  "DTSTART:20261014T000000Z",
  "DTEND:20261014T010000Z",
  "STATUS:CANCELLED",
  "SUMMARY:취소된 반복",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

describe("parseEvents", () => {
  const items = parseEvents(ics);

  it("converts zoned, all-day, and UTC times to the Google item shape", () => {
    expect(items[0]).toMatchObject({ id: "a1@20261014T140000", summary: "영어 스터디, 2층", start: { dateTime: "2026-10-14T05:00:00.000Z" } });
    expect(items[1]).toMatchObject({ start: { date: "2026-10-14" }, end: { date: "2026-10-15" } });
    expect(items[1].summary?.endsWith("긴 제목")).toBe(true); // folded line joined
    expect(items[2]).toMatchObject({ id: "a3@20261014T000000Z", status: "cancelled" });
  });

  it("feeds the same agenda logic as Google", () => {
    const now = Date.parse("2026-10-14T03:00:00Z"); // 12:00 in Seoul
    expect(todayAgenda(items, now).map((e) => e.id)).toContain("a1@20261014T140000");
  });
});
