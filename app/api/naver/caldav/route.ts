// Reads today's Naver Calendar events over CalDAV (SPEC §3.2, D22).
// Stateless: the id and app password come with each request and are never stored or logged.
// One log line per request carries only counts, status codes, and tag names (no ids, hrefs, or event text).
// Only talks to caldav.calendar.naver.com (no open proxy).
import { parseEvents } from "../../../../lib/ical";

const ROOT = "https://caldav.calendar.naver.com/";
const HOST = new URL(ROOT).host;

class AuthError extends Error {}

const tag = (name: string) => new RegExp(`<(?:[\\w-]+:)?${name}\\b[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${name}>`, "g");
const all = (xml: string, name: string) => [...xml.matchAll(tag(name))].map((m) => m[1]);
const first = (xml: string, name: string) => all(xml, name)[0];
const decode = (s: string) =>
  s
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1")
    .replace(/&#13;|&#x0?d;/gi, "\r")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

async function dav(url: string, method: string, auth: string, depth: string, body: string) {
  const target = new URL(url, ROOT);
  if (target.host !== HOST) throw new Error("BAD_HOST");
  const res = await fetch(target, {
    method,
    headers: { Authorization: auth, Depth: depth, "Content-Type": "application/xml; charset=utf-8" },
    body: body || undefined, // GET can't carry a body
  });
  if (res.status === 401 || res.status === 403) throw new AuthError();
  if (!res.ok) throw new Error(`DAV_${res.status}`);
  return { xml: await res.text(), url: target.href };
}

const propfind = (props: string) =>
  `<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop>${props}</d:prop></d:propfind>`;

// "2026-10-14T00:00:00.000Z" → "20261014T000000Z"
const davTime = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (req.headers.get("x-requested-with") !== "XmlHttpRequest" || !origin || new URL(origin).host !== req.headers.get("host")) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const { id, password, timeMin, timeMax, tz } = body ?? {};
  const ok = (v: unknown, max: number): v is string => typeof v === "string" && v.length > 0 && v.length <= max;
  if (!ok(id, 100) || !ok(password, 200) || !ok(timeMin, 40) || !ok(timeMax, 40) || Number.isNaN(Date.parse(timeMin)) || Number.isNaN(Date.parse(timeMax))) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const auth = `Basic ${Buffer.from(`${id}:${password}`).toString("base64")}`;

  try {
    // RFC 4791/6764 discovery: principal → calendar home → calendar collections.
    const root = await dav(ROOT, "PROPFIND", auth, "0", propfind("<d:current-user-principal/>"));
    const principal = first(first(root.xml, "current-user-principal") ?? "", "href");
    const p = principal ? await dav(decode(principal.trim()), "PROPFIND", auth, "0", propfind("<c:calendar-home-set/>")) : root;
    const home = first(first(p.xml, "calendar-home-set") ?? "", "href");
    const homeUrl = home ? new URL(decode(home.trim()), ROOT).href : p.url;
    const list = await dav(homeUrl, "PROPFIND", auth, "1", propfind("<d:resourcetype/>"));
    const responses = all(list.xml, "response");
    // `<cal:calendar xmlns:cal="…"/>`, `<C:calendar/>`, or `<calendar></calendar>`; not calendar-home-set etc.
    const calendars = responses
      .filter((r) => /<(?:[\w-]+:)?calendar[\s/>]/.test(first(r, "resourcetype") ?? ""))
      .map((r) => decode((first(r, "href") ?? "").trim()))
      .filter(Boolean);

    const start = davTime(timeMin);
    const end = davTime(timeMax);
    const query = `<?xml version="1.0"?><c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><c:calendar-data><c:expand start="${start}" end="${end}"/></c:calendar-data></d:prop><c:filter><c:comp-filter name="VCALENDAR"><c:comp-filter name="VEVENT"><c:time-range start="${start}" end="${end}"/></c:comp-filter></c:comp-filter></c:filter></c:calendar-query>`;
    // Naver answers calendar-query with hrefs but no calendar-data, so fall back to GETting each event (D22).
    const fetchCalendar = async (href: string) => {
      const r = await dav(href, "REPORT", auth, "1", query).catch((e) => {
        if (e instanceof AuthError) throw e;
        return dav(href, "REPORT", auth, "1", query.replace(/<c:expand[^>]*\/>/, "")); // server rejected <expand>
      });
      let data = all(r.xml, "calendar-data").map((d) => decode(d.trim())).filter(Boolean);
      let path = "report";
      if (!data.length) {
        const hrefs = all(r.xml, "response")
          .map((x) => decode((first(x, "href") ?? "").trim()))
          .filter((h) => h && !h.endsWith("/"));
        data = (
          await Promise.all(
            hrefs.slice(0, 100).map((h) =>
              dav(h, "GET", auth, "0", "").then(
                (x) => x.xml,
                (e) => {
                  if (e instanceof AuthError) throw e;
                  return "";
                },
              ),
            ),
          )
        ).filter(Boolean);
        path = hrefs.length ? "get" : "empty";
      }
      const tags = [...new Set([...r.xml.matchAll(/<(?:[\w-]+:)?([\w-]+)/g)].map((m) => m[1]))];
      return { data, path, tags };
    };
    const results = await Promise.all(calendars.map(fetchCalendar));
    const window = { start: Date.parse(timeMin), end: Date.parse(timeMax), tz: typeof tz === "string" && tz.length <= 64 ? tz : "Asia/Seoul" };
    const items = results.flatMap((r) => r.data.flatMap((d) => parseEvents(d, window)));
    console.log(
      "naver caldav",
      JSON.stringify({
        calendars: calendars.length,
        paths: results.map((r) => `${r.path}:${r.data.length}`),
        tags: [...new Set(results.flatMap((r) => r.tags))],
        items: items.length,
      }),
    );
    return Response.json({ items });
  } catch (e) {
    if (e instanceof AuthError) return Response.json({ error: "auth" }, { status: 401 });
    console.log("naver caldav failed", (e as Error).message);
    return Response.json({ error: "caldav_failed" }, { status: 502 });
  }
}
