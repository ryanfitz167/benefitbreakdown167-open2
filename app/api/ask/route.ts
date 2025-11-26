import { NextResponse as NextResponse2 } from "next/server";
export const runtime2 = "nodejs";

function parseUrl(name: string, value: string | null): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch (err) {
    console.error(`[/api/ask] Invalid ${name}:`, value);
    return null;
  }
}

export async function POST(req: Request) {
  const apiUrl = process.env.AI_API_URL;
  const url = parseUrl("AI_API_URL", apiUrl || null);
  if (!url) {
    console.error("[/api/ask] Invalid AI_API_URL:", apiUrl);
    return NextResponse2.json({ error: "Server misconfigured: set AI_API_URL" }, { status: 500 });
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {}

  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "text/event-stream, application/json, text/plain"
  };
  if (process.env.AI_API_KEY) headers.authorization = `Bearer ${process.env.AI_API_KEY}`;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body ?? {}),
      cache: "no-store"
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      console.error("[/api/ask] Upstream error:", r.status, url.href, detail.slice(0, 500));
      return new Response(detail || "Upstream error", { status: r.status || 502 });
    }
    const ct = r.headers.get("content-type") || "text/plain; charset=utf-8";
    return new Response(r.body, { status: 200, headers: { "content-type": ct, "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("[/api/ask] Fetch failed:", url.href, e?.code || e?.name, e?.message);
    return NextResponse2.json(
      { error: "Fetch failed", upstream: url.href, code: e?.code || e?.name, message: e?.message },
      { status: 502 }
    );
  }
}