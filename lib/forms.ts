import fs from "node:fs";
import path from "node:path";

const base = process.env.FORMS_BACKEND_BASE_URL?.replace(/\/+$/, "");
const newsletterPath = process.env.FORMS_BACKEND_NEWSLETTER_PATH || "/api/subscribe";
const brokerPath = process.env.FORMS_BACKEND_BROKER_PATH || "/api/broker";

// Where to dump dev JSON (local only; Vercel fs is ephemeral)
const DATA_DIR = path.join(process.cwd(), "var", "data");
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function forwardOrStore(kind: "newsletter" | "broker", payload: any) {
  // If a backend is configured, forward there
  if (base) {
    const url = kind === "newsletter" ? `${base}${newsletterPath}` : `${base}${brokerPath}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Backend responded ${res.status}: ${text}`);
    }
    return { ok: true, forwarded: true };
  }

  // Local dev storage (safe to test; not persistent in serverless)
  ensureDataDir();
  const file = path.join(DATA_DIR, `${kind}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  return { ok: true, forwarded: false, file };
}

export function sanitizeEmail(email: unknown) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
