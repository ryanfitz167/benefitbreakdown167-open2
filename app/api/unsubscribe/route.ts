export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const SUB_FILE = path.join(DATA_DIR, "submissions.json");
const UNSUB_FILE = path.join(DATA_DIR, "unsubscribed.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return fallback; }
}
async function writeJson(file: string, data: any) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const subs = await readJson<any[]>(SUB_FILE, []);
    const remaining = subs.filter(s => s?.email?.toLowerCase() !== email);
    const unsubs = await readJson<string[]>(UNSUB_FILE, []);
    const set = new Set(unsubs); set.add(email);

    await writeJson(SUB_FILE, remaining);
    await writeJson(UNSUB_FILE, Array.from(set));

    return NextResponse.json({ ok: true, removed: email });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
