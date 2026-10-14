import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const req = (body: unknown) =>
  new Request("https://stillroom-app.vercel.app/api/naver/caldav", {
    method: "POST",
    headers: { host: "stillroom-app.vercel.app", origin: "https://stillroom-app.vercel.app", "x-requested-with": "XmlHttpRequest" },
    body: JSON.stringify(body),
  });
const today = { id: "me", password: "app-pw", timeMin: "2026-10-13T15:00:00.000Z", timeMax: "2026-10-14T15:00:00.000Z" };
const xml = (s: string) => new Response(s, { status: 207 });

afterEach(() => vi.unstubAllGlobals());

describe("POST /api/naver/caldav", () => {
  it("discovers calendars and returns today's events", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (url: URL, init: RequestInit) => {
      calls.push(`${init.method} ${url.pathname}`);
      if (url.pathname === "/") return xml(`<D:multistatus xmlns:D="DAV:"><D:response><D:propstat><D:prop><D:current-user-principal><D:href>/principals/me/</D:href></D:current-user-principal></D:prop></D:propstat></D:response></D:multistatus>`);
      if (url.pathname === "/principals/me/") return xml(`<multistatus xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav"><response><propstat><prop><C:calendar-home-set><href>/calendar/me/</href></C:calendar-home-set></prop></propstat></response></multistatus>`);
      if (init.method === "PROPFIND") return xml(`<d:multistatus xmlns:d="DAV:" xmlns:cal="urn:ietf:params:xml:ns:caldav"><d:response><d:href>/calendar/me/</d:href><d:propstat><d:prop><d:resourcetype><d:collection/></d:resourcetype></d:prop></d:propstat></d:response><d:response><d:href>/calendar/me/work/</d:href><d:propstat><d:prop><d:resourcetype><d:collection/><cal:calendar xmlns:cal="urn:ietf:params:xml:ns:caldav"/></d:resourcetype></d:prop></d:propstat></d:response></d:multistatus>`);
      return xml(`<d:multistatus xmlns:d="DAV:" xmlns:cal="urn:ietf:params:xml:ns:caldav"><d:response><d:href>/calendar/me/work/1.ics</d:href><d:propstat><d:prop><cal:calendar-data>BEGIN:VCALENDAR&#13;
BEGIN:VEVENT&#13;
UID:x&#13;
DTSTART:20261014T050000Z&#13;
DTEND:20261014T060000Z&#13;
SUMMARY:팀 회의 &amp; 점심&#13;
END:VEVENT&#13;
END:VCALENDAR</cal:calendar-data></d:prop></d:propstat></d:response></d:multistatus>`);
    });
    const res = await POST(req(today));
    expect(res.status).toBe(200);
    const { items } = await res.json();
    expect(items).toEqual([{ id: "x@20261014T050000Z", summary: "팀 회의 & 점심", start: { dateTime: "2026-10-14T05:00:00Z" }, end: { dateTime: "2026-10-14T06:00:00Z" } }]);
    expect(calls).toEqual(["PROPFIND /", "PROPFIND /principals/me/", "PROPFIND /calendar/me/", "REPORT /calendar/me/work/"]);
  });

  it("maps a wrong id or app password to 401 and rejects bad input or other origins", async () => {
    vi.stubGlobal("fetch", async () => new Response("", { status: 401 }));
    expect((await POST(req(today))).status).toBe(401);
    expect((await POST(req({ ...today, password: "" }))).status).toBe(400);
    const cross = new Request("https://stillroom-app.vercel.app/api/naver/caldav", { method: "POST", headers: { host: "stillroom-app.vercel.app", origin: "https://evil.example", "x-requested-with": "XmlHttpRequest" }, body: "{}" });
    expect((await POST(cross)).status).toBe(403);
  });
});
