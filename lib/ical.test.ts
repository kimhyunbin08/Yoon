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

describe("recurring events (server didn't expand)", () => {
  const cal = (...ev: string[]) => ["BEGIN:VCALENDAR", ...ev, "END:VCALENDAR"].join("\r\n");
  const day = { start: Date.parse("2026-10-13T15:00:00Z"), end: Date.parse("2026-10-14T15:00:00Z"), tz: "Asia/Seoul" }; // Wed 2026-10-14 in Seoul
  const ev = (uid: string, rule: string, extra: string[] = [], start = "20260901T190000") =>
    ["BEGIN:VEVENT", `UID:${uid}`, `DTSTART;TZID=Asia/Seoul:${start}`, `DTEND;TZID=Asia/Seoul:${start.slice(0, 9)}200000`, `RRULE:${rule}`, `SUMMARY:${uid}`, ...extra, "END:VEVENT"].join("\r\n");
  const ids = (ics: string) => parseEvents(ics, day).map((e) => e.id);

  it("expands daily, weekly, monthly, and yearly rules onto today", () => {
    expect(ids(cal(ev("daily", "FREQ=DAILY")))).toEqual(["daily@20261014"]);
    expect(ids(cal(ev("wed", "FREQ=WEEKLY;BYDAY=MO,WE")))).toEqual(["wed@20261014"]);
    expect(ids(cal(ev("tue", "FREQ=WEEKLY;BYDAY=TU")))).toEqual([]);
    expect(ids(cal(ev("biweekly", "FREQ=WEEKLY;INTERVAL=2;BYDAY=WE", [], "20261007T190000")))).toEqual([]);
    expect(ids(cal(ev("2ndwed", "FREQ=MONTHLY;BYDAY=2WE")))).toEqual(["2ndwed@20261014"]);
    expect(ids(cal(ev("14th", "FREQ=MONTHLY", [], "20260514T190000")))).toEqual(["14th@20261014"]);
    expect(ids(cal(ev("bday", "FREQ=YEARLY", [], "20201014T190000")))).toEqual(["bday@20261014"]);
    const [occ] = parseEvents(cal(ev("daily", "FREQ=DAILY")), day);
    expect(occ.start).toEqual({ dateTime: "2026-10-14T10:00:00.000Z" }); // 19:00 Seoul
  });

  it("honors UNTIL, COUNT, EXDATE, and moved occurrences", () => {
    expect(ids(cal(ev("ended", "FREQ=DAILY;UNTIL=20261001T000000Z")))).toEqual([]);
    expect(ids(cal(ev("three", "FREQ=DAILY;COUNT=3")))).toEqual([]);
    expect(ids(cal(ev("skip", "FREQ=DAILY", ["EXDATE;TZID=Asia/Seoul:20261014T190000"])))).toEqual([]);
    const moved = ["BEGIN:VEVENT", "UID:mv", "RECURRENCE-ID;TZID=Asia/Seoul:20261014T190000", "DTSTART;TZID=Asia/Seoul:20261014T210000", "DTEND;TZID=Asia/Seoul:20261014T220000", "SUMMARY:mv", "END:VEVENT"].join("\r\n");
    expect(ids(cal(ev("mv", "FREQ=DAILY"), moved))).toEqual(["mv@20261014T190000"]);
  });

  it("expands all-day yearly events", () => {
    const allDay = ["BEGIN:VEVENT", "UID:anniv", "DTSTART;VALUE=DATE:20201014", "DTEND;VALUE=DATE:20201015", "RRULE:FREQ=YEARLY", "END:VEVENT"].join("\r\n");
    expect(parseEvents(cal(allDay), day)).toMatchObject([{ id: "anniv@20261014", start: { date: "2026-10-14" }, end: { date: "2026-10-15" } }]);
  });
});
