// app/api/optin/route.ts
import { NextResponse } from "next/server";
import { ENV } from "@/lib/env";

function isEmail(v: unknown): v is string {
  return typeof v === "string" && /\S+@\S+\.\S+/.test(v);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, wantsBroker, employees, comments, sourceSlug, sourceTitle, honeypot } = body || {};

    if (honeypot) {
      return NextResponse.json({ ok: true, skipped: "honeypot" });
    }
    if (!isEmail(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    if (ENV.OPTIN_WEBHOOK_URL) {
      const fwd = await fetch(ENV.OPTIN_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: wantsBroker ? "newsletter+broker" : "newsletter",
          email,
          employees: employees ? Number(employees) : null,
          comments: comments || null,
          sourceSlug,
          sourceTitle,
          ts: new Date().toISOString(),
        }),
      });

      if (fwd.status === 409) {
        return NextResponse.json({ ok: false, error: "Duplicate" }, { status: 409 });
      }
      if (!fwd.ok) {
        const txt = await fwd.text();
        return new NextResponse(txt || "Upstream error", { status: 502 });
      }
    } else {
      console.log("[optin]", {
        email,
        wantsBroker: !!wantsBroker,
        employees: employees ? Number(employees) : null,
        comments: comments || null,
        sourceSlug,
        sourceTitle,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 });
  }
}

