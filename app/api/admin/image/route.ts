// app/api/admin/image/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const topic: string = String(body?.topic || "");
    const style: string = String(body?.style || "clean editorial health illustration, natural lighting, professional, magazine quality");
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 400 });
    }

    // Strong instruction: absolutely no text in image
    const prompt = `
${topic}.
High-quality, professional editorial hero image for a health/benefits article.
No words, no typography, no letters or numbers, no logos, no watermarks, no text in any language.
${style}.
`.trim();

    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        size: "1024x1024",
        n: 1,
        // quality: "hd" // optional
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "Image generation failed");

    const url = data?.data?.[0]?.url;
    if (!url) throw new Error("No image URL in response");

    return NextResponse.json({ ok: true, image: { url, alt: topic } });
  } catch (e: any) {
    // Heads-up: OpenAI may still require a verified org for images, even with DALL·E 3.
    return NextResponse.json(
      { error: e?.message || "Failed to generate image (your OpenAI org may need verification for images)" },
      { status: 500 }
    );
  }
}
