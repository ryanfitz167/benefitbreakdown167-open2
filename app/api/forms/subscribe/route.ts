import { forwardOrStore, sanitizeEmail, isValidEmail } from "@/lib/forms";

export const runtime = "nodejs"; // or "edge" if your admin backend supports CORS/edge
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = sanitizeEmail(body.email);
    const name = (body.name ?? "").toString().trim();

    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid email." }), { status: 400 });
    }

    const meta = {
      email,
      name,
      source: body.source ?? "website",
      consent: !!body.consent,
      ts: new Date().toISOString(),
      ua: req.headers.get("user-agent") || "",
    };

    const result = await forwardOrStore("newsletter", meta);
    const { ok: _ok, ...rest } = result ?? {};
    return new Response(JSON.stringify({ ok: true, ...rest }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "Failed" }), { status: 500 });
  }
}
