import { NextResponse } from "next/server";
import { sanitize, validateNewsletter } from "../../lead/validate";
import { postToGAS, notifySlack } from "../../lead/upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NewsletterLead = {
  type: "newsletter";
  email: string;
  sourceSlug?: string;
  sourceTitle?: string;
  company_website?: string; // honeypot
};

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    if (raw?.company_website) return bad("spam_detected", 400);

    const payload: NewsletterLead = sanitize({
      type: "newsletter",
      email: raw?.email,
      sourceSlug: raw?.sourceSlug,
      sourceTitle: raw?.sourceTitle,
    });

    const errs = validateNewsletter(payload);
    if (errs.length) return bad(errs.join(", "), 400);

    const upstream = await postToGAS(payload, "newsletter");
    if (!upstream?.ok) return bad(upstream?.error || "upstream_error", 502);

    await notifySlack(payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[newsletter] proxy_error", err);
    return bad("proxy_error", 502);
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "newsletter alive" });
}


