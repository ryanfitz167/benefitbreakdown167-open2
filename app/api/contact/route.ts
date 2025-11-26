export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type Message = {
  id: string;
  name?: string | null;
  email: string;
  subject?: string | null;
  message: string;
  newsletterOptIn?: boolean;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "messages.json");

async function readAll(): Promise<Message[]> {
  try { return JSON.parse(await fs.readFile(FILE, "utf8")); } catch { return []; }
}
async function writeAll(rows: Message[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
}

async function verifyRecaptcha(token?: string | null) {
  try {
    if (!token) return true;
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) return true;
    const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const json = await resp.json();
    return !!json?.success && (typeof json?.score !== "number" || json.score >= 0.4);
  } catch { return true; }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const email = String(form.get("email") ?? "").trim();
    const token = String(form.get("recaptchaToken") ?? "") || undefined;
    const msg = String(form.get("message") ?? "").trim();
    if (!email || !email.includes("@") || !msg) {
      return NextResponse.json({ ok: false, error: "Email and message are required." }, { status: 400 });
    }

    const passed = await verifyRecaptcha(token);
    if (!passed) return NextResponse.json({ ok: false, error: "reCAPTCHA failed" }, { status: 400 });

    const payload: Message = {
      id: crypto.randomUUID(),
      name: (form.get("name") as string) || null,
      email,
      subject: (form.get("subject") as string) || null,
      message: msg,
      newsletterOptIn: String(form.get("newsletterOptIn") ?? "") === "on",
      createdAt: new Date().toISOString(),
    };

    const all = await readAll();
    all.unshift(payload);
    await writeAll(all);

    return NextResponse.json({ ok: true, saved: payload, count: all.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}

