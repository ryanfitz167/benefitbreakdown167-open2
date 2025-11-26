// FILE: app/api/generate-image/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

type ReqBody = {
  prompt?: string;
  /** Optional convenience: "square" | "wide" | "tall" | explicit "WxH" like "1536x1024"/"1792x1024" */
  size?: string;
  orientation?: "square" | "wide" | "tall";
};

const SIZES = {
  gpt: new Set(["1024x1024", "1024x1536", "1536x1024", "auto"]),
  dalle: new Set(["1024x1024", "1024x1792", "1792x1024"]),
} as const;

function isVerificationError(e: any): boolean {
  const msg = String(e?.message || e?.error?.message || "");
  const code = e?.code || e?.error?.code;
  return /verify|verification|required|organization/i.test(msg) || code === "organization_verification_required";
}

function safeErr(e: any) {
  try {
    return JSON.stringify({
      message: e?.message,
      type: e?.type,
      code: e?.code,
      status: e?.status,
      param: e?.param,
      detail: e?.error || undefined,
    });
  } catch {
    return String(e);
  }
}

/** Normalize an orientation/size to a model-supported size. */
function pickSizeForModel(
  input: string | undefined | null,
  orientation: string | undefined | null,
  modelFamily: "gpt" | "dalle"
): "1024x1024" | "1024x1536" | "1536x1024" | "1024x1792" | "1792x1024" {
  const v = (input || "").toLowerCase().trim();
  const o = (orientation || "").toLowerCase().trim();

  if (o === "square") return "1024x1024";
  if (o === "wide") return modelFamily === "gpt" ? "1536x1024" : "1792x1024";
  if (o === "tall") return modelFamily === "gpt" ? "1024x1536" : "1024x1792";

  if (v) {
    if (modelFamily === "gpt") {
      if (SIZES.gpt.has(v as any)) return v as any;
      if (v === "1792x1024") return "1536x1024";
      if (v === "1024x1792") return "1024x1536";
      if (v === "1024x1024") return "1024x1024";
    } else {
      if (SIZES.dalle.has(v as any)) return v as any;
      if (v === "1536x1024") return "1792x1024";
      if (v === "1024x1536") return "1024x1792";
      if (v === "1024x1024" || v === "auto") return "1024x1024";
    }
  }

  // Default: wide hero
  return modelFamily === "gpt" ? "1536x1024" : "1792x1024";
}

async function fetchUrlToBase64(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch URL failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") || "image/png";
  const b64 = buf.toString("base64");
  return { base64: b64, contentType: ct };
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const body: ReqBody = await req.json().catch(() => ({} as ReqBody));
  const prompt = (body.prompt || "").trim();
  if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });

  const preferred = (process.env.OPENAI_IMAGE_MODEL || "gpt-image-1").trim();
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async function generate(model: string, modelFamily: "gpt" | "dalle") {
    const size = pickSizeForModel(body.size, body.orientation, modelFamily);

    // Keep request minimal/compatible across models
    const res: any = await client.images.generate({
      model,
      prompt,
      size,
      n: 1,
      // NO response_format here (causes 400 on some deployments)
      // You can optionally add: style, quality, background if you need them.
    } as any);

    const item = res?.data?.[0] ?? {};
    const b64 = item.b64_json;
    const url = item.url;
    const revised_prompt = item.revised_prompt;

    if (b64 && typeof b64 === "string" && b64.length > 0) {
      return { base64: b64, model, size, revised_prompt: revised_prompt || null };
    }

    if (url && typeof url === "string") {
      const fetched = await fetchUrlToBase64(url);
      return {
        base64: fetched.base64,
        model,
        size,
        revised_prompt: revised_prompt || null,
        contentType: fetched.contentType,
      };
    }

    throw new Error(
      `No image data in response (model=${model}, size=${size}). Raw: ` +
        (() => {
          try { return JSON.stringify(res); } catch { return "[unserializable response]"; }
        })()
    );
  }

  try {
    if (preferred.startsWith("gpt-image-1")) {
      try {
        const out = await generate(preferred, "gpt");
        return NextResponse.json(out);
      } catch (e: any) {
        if (isVerificationError(e)) {
          // Auto-fallback to DALL·E 3 with proper size mapping
          try {
            const out2 = await generate("dall-e-3", "dalle");
            return NextResponse.json(out2);
          } catch (e2: any) {
            return NextResponse.json(
              { error: "OpenAI image error", detail: safeErr(e2), note: "Tried gpt-image-1 then dall-e-3" },
              { status: 400 }
            );
          }
        }
        return NextResponse.json({ error: "OpenAI image error", detail: safeErr(e) }, { status: 400 });
      }
    }

    if (/dall-?e/i.test(preferred)) {
      const out = await generate("dall-e-3", "dalle");
      return NextResponse.json(out);
    }

    // Default: treat as GPT image family
    const out = await generate(preferred, "gpt");
    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json({ error: "OpenAI image error", detail: safeErr(e) }, { status: 400 });
  }
}
