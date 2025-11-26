export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type Submission = {
  id: string;
  email: string;
  employeeCount?: number | null;
  topics?: string | null;
  question?: string | null;
  connectWithBroker?: boolean;
  userAgent?: string | null;
  ip?: string | null;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "submissions.json");
const UNSUB_FILE = path.join(DATA_DIR, "unsubscribed.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return fallback; }
}
async function writeJson(file: string, data: any) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

async function verifyRecaptcha(token?: string | null) {
  try {
    if (!token) return true; // soft-allow if missing (dev)
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
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const token = String(form.get("recaptchaToken") ?? "") || undefined;
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const passed = await verifyRecaptcha(token);
    if (!passed) return NextResponse.json({ ok: false, error: "reCAPTCHA failed" }, { status: 400 });

    const unsubList: string[] = await readJson(UNSUB_FILE, []);
    if (unsubList.includes(email)) {
      return NextResponse.json({ ok: false, error: "Email is unsubscribed" }, { status: 400 });
    }

    const employeeCountRaw = form.get("employeeCount");
    const employeeCount = employeeCountRaw ? Number(employeeCountRaw) : null;

    const payload: Submission = {
      id: crypto.randomUUID(),
      email,
      employeeCount: Number.isFinite(employeeCount) ? employeeCount : null,
      topics: (form.get("topics") as string) || null,
      question: (form.get("question") as string) || null,
      connectWithBroker: String(form.get("connectWithBroker") ?? "") === "on",
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      createdAt: new Date().toISOString(),
    };

    const all: Submission[] = await readJson(FILE, []);
    // de-dupe by email: keep newest
    const filtered = all.filter(s => s.email !== email);
    filtered.unshift(payload);
    await writeJson(FILE, filtered);

    return NextResponse.json({ ok: true, saved: payload, count: filtered.length });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
