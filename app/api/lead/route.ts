import { NextResponse } from "next/server";

// Node runtime is better if you might grow this (e.g., DB writes)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeadPayload = {
  type: "broker" | "newsletter";
  email: string;
  employees?: number;
  comments?: string;
  sourceSlug?: string;
  sourceTitle?: string;
};

function bad(msg: string, code = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status: code });
}

async function postWithRetry(url: string, init: RequestInit, attempts = 3) {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { ...init, cache: "no-store" });
      return res;
    } catch (err) {
      lastErr = err;
      // small backoff
      await new Promise((r) => setTimeout(r, 150 * (i + 1)));
    }
  }
  throw lastErr;
}

export async function POST(req: Request) {
  try {
    if (!process.env.WEBHOOK_URL || !process.env.WEBHOOK_SECRET) {
      return bad("Server not configured: missing WEBHOOK_URL or WEBHOOK_SECRET", 500);
    }

    const incoming = (await req.json()) as Partial<LeadPayload>;
    if (!incoming?.type || !incoming?.email) {
      return bad("Missing required fields: type, email");
    }

    // Send to GAS from the server (no browser CORS issues)
    const url = `${process.env.WEBHOOK_URL}?key=${encodeURIComponent(process.env.WEBHOOK_SECRET)}`;

    const res = await postWithRetry(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incoming),
      },
      2
    );

    // GAS always returns 200; we inspect JSON { ok: boolean, error?: string }
    const data = (await res.json()) as { ok?: boolean; error?: string };

    if (!data?.ok) {
      // Bubble up the GAS error text for debugging
      return bad(data?.error || "Upstream error", 502);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // This is the error that shows up as {"ok":false,"error":"fetch failed"} on your site.
    // By handling it here, we make the message clearer:
    return bad(`proxy_error: ${err?.message || String(err)}`, 502);
  }
}

export async function GET() {
  // Optional health check
  return NextResponse.json({ ok: true, message: "lead api alive" });
}
