// FILE: app/api/health/ai/route.ts
import { NextResponse as NRx } from "next/server";
export const runtime = "nodejs";
const clean3 = (v?: string | null) => (v ? v.trim() : null);
export async function GET() {
  const gen = clean3(process.env.AI_GENERATE_URL);
  const img = clean3(process.env.AI_IMAGE_URL);
  const openai = Boolean(clean3(process.env.OPENAI_API_KEY));
  return NRx.json({
    generate_provider: gen ? "proxy" : openai ? "openai" : "unconfigured",
    image_provider: img ? "proxy" : openai ? "openai" : "unconfigured",
    AI_GENERATE_URL: gen || null,
    AI_IMAGE_URL: img || null,
    OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
    has_OPENAI_API_KEY: openai
  });
}