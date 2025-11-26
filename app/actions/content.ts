// app/actions/content.ts
"use server";

import OpenAI from "openai";
import fs from "node:fs/promises";
import path from "node:path";
import { POSTS_PATH } from "@/lib/posts";
import { toTopicSlug } from "@/lib/topics";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Map your minutes → words per your spec
function minutesToWords(min: number) {
  // Your ask: ~300–400 wpm targets:
  // 5min≈1500, 7min≈2100–2800, 10min≈3000–4000
  if (min <= 3) return 900;         // short
  if (min <= 5) return 1500;
  if (min <= 7) return 2400;
  if (min <= 10) return 3500;
  return Math.round(min * 350);     // default scale
}

function slugify(s: string): string {
  return s.trim().toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function wordCount(t: string) {
  return (t.trim().match(/\S+/g) ?? []).length;
}

function nowISODate() {
  return new Date().toISOString().slice(0, 10);
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

function imageSizeFromOrientation(o: string): "1024x1024" | "1024x1536" | "1536x1024" | "auto" {
  // Fixes your 400 error about '1792x1024'
  if (o === "portrait") return "1024x1536";
  if (o === "square") return "1024x1024";
  return "1536x1024"; // landscape default
}

export async function generateArticleAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const topic = String(formData.get("topic") ?? "In the News");
  const minutes = Number(formData.get("minutes") ?? 5);
  const orientation = String(formData.get("orientation") ?? "landscape");

  if (!title) return { error: "Title required." };

  const slug = slugify(title);
  const topicSlug = toTopicSlug(topic);
  const targetWords = minutesToWords(minutes);

  // --- 1) Generate the article in chunks until we hit target words
  let body = "";
  let round = 0;

  while (wordCount(body) < targetWords && round < 8) {
    round++;
    const remaining = Math.max(0, targetWords - wordCount(body));
    const nextTarget = Math.min(1100, remaining + 150); // generate ~1k words per chunk

    const sys = `You are a precise benefits writer. Use clear headings (H2/H3), bullets, short paragraphs. 
Write original prose for US employers & HR. Cite no URLs; do not add "conclusion:" literally; use a natural closing.`;

    const user = `Continue writing an article titled: "${title}".
Desired total length: at least ${targetWords} words. 
Write the next ~${nextTarget} words. Do not repeat prior text. 
Maintain structure:
- Intro summary (if not already done)
- 4–7 sections with H2 headers and short lead-ins
- Use callouts, bullets, and definitions
- End with a practical checklist or takeaways.

Topic focus: ${topic}.
Audience: HR leaders at 40–150 employee companies. 
Tone: plain-English, authoritative, helpful.`;

    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      // no response_format here (avoid your earlier 400)
      // tokens large enough to get ~1k words per chunk
      max_tokens: 2000,
    });

    const chunk = res.choices[0]?.message?.content ?? "";
    body += (body ? "\n\n" : "") + chunk;
    if (!chunk.trim()) break;
  }

  // Guard-rail: if still short, add a final "expand" pass
  if (wordCount(body) < targetWords) {
    const expand = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        { role: "system", content: "Expand and deepen content with new, non-repetitive material." },
        { role: "user", content: `Expand to reach at least ${targetWords} words while keeping structure and quality:\n\n${body}` },
      ],
      max_tokens: 2000,
    });
    body = expand.choices[0]?.message?.content ? `${body}\n\n${expand.choices[0].message.content}` : body;
  }

  // --- 2) Generate hero image with supported size
  const size = imageSizeFromOrientation(orientation);
  const img = await client.images.generate({
    model: "gpt-image-1",
    prompt: `Crisp, editorial-style hero image for an article titled "${title}" about ${topic}. Minimalistic, professional, readable as a banner.`,
    size, // valid sizes only
    // Do NOT pass response_format here; default returns b64_json
  });

  const b64 = img.data?.[0]?.b64_json;
  let heroUrl: string | undefined = undefined;

  if (b64) {
    const heroDir = path.join(process.cwd(), "public", "hero");
    await ensureDir(heroDir);
    const heroPath = path.join(heroDir, `${slug}.png`);
    await fs.writeFile(heroPath, Buffer.from(b64, "base64"));
    heroUrl = `/hero/${slug}.png`;
  }

  // --- 3) Write the MDX with front-matter (includes topic + topicSlug)
  const fm = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    `date: ${nowISODate()}`,
    `readingTime: ""`, // will be computed in lib/posts.ts
    `topic: ${JSON.stringify(topic)}`,
    `topicSlug: ${JSON.stringify(topicSlug)}`,
    `tags: []`,
    heroUrl ? `heroUrl: ${JSON.stringify(heroUrl)}` : undefined,
    "---",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  await fs.writeFile(path.join(POSTS_PATH, `${slug}.mdx`), fm + body, "utf8");

  return { slug, topicSlug };
}
