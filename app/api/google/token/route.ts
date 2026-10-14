// Swaps a Google sign-in code or a refresh token for an access token (SPEC §3.2, D21).
// Stateless: holds the client secret, stores and logs nothing, and only talks to Google's token endpoint.

export async function POST(req: Request) {
  // CSRF guard for the GIS popup flow, plus same-origin only.
  const origin = req.headers.get("origin");
  if (req.headers.get("x-requested-with") !== "XmlHttpRequest" || !origin || new URL(origin).host !== req.headers.get("host")) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !secret) return Response.json({ error: "not_configured" }, { status: 503 });

  const body: unknown = await req.json().catch(() => null);
  const { code, refresh_token } = (body ?? {}) as { code?: unknown; refresh_token?: unknown };
  const grant: Record<string, string> | null =
    typeof code === "string"
      ? { grant_type: "authorization_code", code, redirect_uri: "postmessage" }
      : typeof refresh_token === "string"
        ? { grant_type: "refresh_token", refresh_token }
        : null;
  if (!grant) return Response.json({ error: "bad_request" }, { status: 400 });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ ...grant, client_id: clientId, client_secret: secret }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  // 400 = the grant is bad (revoked, expired): the client asks her to reconnect.
  if (!res.ok) return Response.json({ error: data.error ?? "token_failed" }, { status: res.status === 400 ? 400 : 502 });
  return Response.json({ access_token: data.access_token, expires_in: data.expires_in, refresh_token: data.refresh_token });
}
