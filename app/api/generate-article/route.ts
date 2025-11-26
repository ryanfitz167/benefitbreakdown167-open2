// FILE: app/api/generate-article/route.ts
import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import OpenAI from "openai";
import { labelToTopicSlug } from "@/lib/topics";

export const runtime = "nodejs";

type GenPayload = {
  topic: string;    // label or slug
  prompt: string;   // user brief
  minutes?: number; // 3..12
};

// ---------- length helpers ----------
function minutesToWords(min = 5): number {
  if (min <= 3) return 900;
  if (min <= 5) return 1500;   // your spec
  if (min <= 7) return 2400;
  if (min <= 10) return 3500;
  if (min <= 12) return 4200;
  return Math.round(min * 350);
}
function countWords(s: string): number {
  return (s.trim().match(/\S+/g) ?? []).length;
}

// ---------- prompt helpers ----------
function sysPrompt(minutes = 5, targetWords = 1500) {
  return `
You are Benefit Breakdown's editor. Write a ${minutes}-minute, plain-English article in a professional, scannable style (similar to 1440). Use short sections with clear **bolded** subheads, bullets where helpful, and include in-text numeric citations like [1], [2] at each factual claim that relies on a source. Research and pull from at least TWO credible, professional sources (gov, academic, reputable outlets, or statutes/rules).

ABSOLUTE REQUIREMENT:
- "bodyMarkdown" MUST be **at least ${targetWords} words** (count words). If your draft is shorter, KEEP WRITING until the full article meets or exceeds ${targetWords} words.

Output MUST be strict JSON with this schema (no extra keys):
{
  "title": "string",
  "dek": "one-sentence summary",
  "bodyMarkdown": "markdown with headings and in-text [1]-style citations",
  "sources": [
    {"title":"string","url":"https://...","publisher":"string","date":"YYYY-MM-DD"},
    ...
  ],
  "tags": ["string", ...],
  "image_prompt": "clean prompt for an original, non-copyrighted illustration or abstract image"
}

Rules:
- Do NOT include a top-level H1 in bodyMarkdown (the page supplies it).
- Each [n] must map to sources[n-1].
- Be neutral, practical, and note trade-offs. Flag variation by state or carrier when relevant.
`.trim();
}

function extractJsonLoose(text: string) {
  if (!text || typeof text !== "string") throw new Error("empty");
  const fence = text.match(/```json\s*([\s\S]*?)\s*```/i);
  const raw = fence?.[1] ?? text;

  try { return JSON.parse(raw); } catch {}

  const i = raw.indexOf("{");
  if (i >= 0) {
    let depth = 0;
    for (let j = i; j < raw.length; j++) {
      if (raw[j] === "{") depth++;
      else if (raw[j] === "}") {
        depth--;
        if (depth === 0) {
          const candidate = raw.slice(i, j + 1);
          try { return JSON.parse(candidate); } catch {}
        }
      }
    }
  }
  throw new Error("non-json");
}

// relative → absolute (proxy fallback)
function toAbsoluteURL(input: string): string {
  try { new URL(input); return input; } catch {}
  const h = nextHeaders();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) throw new Error("Cannot resolve relative URL: missing Host header");
  const path = input.startsWith("/") ? input : `/${input}`;
  return `${proto}://${host}${path}`;
}

// Prefer Responses API for gpt-5, but we’ll try Chat first with JSON Schema (most reliable)
function isGpt5(model: string) {
  return /^gpt-5/i.test(model);
}

// Pull any text from any SDK shape (Responses or Chat)
function pluckText(resp: any): string {
  if (!resp) return "";

  if (typeof resp.output_text === "string" && resp.output_text.trim()) return resp.output_text;

  // Responses structured output
  const out = resp.output;
  if (Array.isArray(out)) {
    for (const item of out) {
      const blocks = item?.content;
      if (Array.isArray(blocks)) {
        for (const b of blocks) {
          const val = b?.text?.value ?? b?.content ?? (typeof b === "string" ? b : undefined);
          if (typeof val === "string" && val.trim()) return val;
        }
      }
    }
  }

  // Chat Completions
  const choice = resp?.choices?.[0];
  if (choice?.message?.content && typeof choice.message.content === "string") {
    if (choice.message.content.trim()) return choice.message.content;
  }

  return "";
}

// ---------- OpenAI multi-shape caller (no temperature) ----------
async function callModelJSON(
  client: OpenAI,
  model: string,
  systemContent: string,
  userContent: string
): Promise<string> {
  // A) Chat Completions with strict JSON Schema (most reliable for JSON)
  const schema = {
    name: "Article",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        dek: { type: "string" },
        bodyMarkdown: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        image_prompt: { type: "string" },
        sources: {
          type: "array",
          minItems: 2,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              url: { type: "string" },
              publisher: { type: "string" },
              date: { type: "string" },
            },
            required: ["title", "url"],
          },
        },
      },
      required: ["title", "dek", "bodyMarkdown", "sources", "tags", "image_prompt"],
    },
    strict: true,
  };

  try {
    const cc = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      // no temperature
      response_format: { type: "json_schema", json_schema: schema },
      // omit token param to avoid model-specific param errors
    } as any);
    const text = pluckText(cc);
    if (text && text.trim()) return text;
  } catch {
    // continue
  }

  // B) Chat Completions with json_object (lighter constraint)
  try {
    const cc2 = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    } as any);
    const text2 = pluckText(cc2);
    if (text2 && text2.trim()) return text2;
  } catch {
    // continue
  }

  // C) Responses API (two shapes). Some GPT-5 variants require this.
  // C1) instructions + input
  try {
    const r1: any = await (client as any).responses.create({
      model,
      instructions: systemContent,
      input: userContent,
      // JSON mode for Responses API:
      text: { format: "json_object" },
      // no temperature, no token param
    });
    const t1 = pluckText(r1);
    if (t1 && t1.trim()) return t1;
  } catch {
    // continue
  }
  // C2) role-based input
  try {
    const r2: any = await (client as any).responses.create({
      model,
      input: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      text: { format: "json_object" },
    });
    const t2 = pluckText(r2);
    if (t2 && t2.trim()) return t2;
  } catch {
    // continue
  }

  // D) One last simple Chat call asking for raw JSON (no format enforcement)
  try {
    const cc3 = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemContent + "\nReturn ONLY the JSON object, no prose." },
        { role: "user", content: userContent },
      ],
    });
    const t3 = pluckText(cc3);
    if (t3 && t3.trim()) return t3;
  } catch {
    // fall through
  }

  return "";
}

// ---------- proxy fallback ----------
async function callProxyJSON(apiUrl: string, headers: Record<string, string>, body: any) {
  const resp = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await resp.text();
  return { ok: resp.ok, status: resp.status, text };
}

// ---------- route ----------
export async function POST(req: Request) {
  const { topic, prompt, minutes }: GenPayload = await req.json();
  if (!topic || !prompt) {
    return NextResponse.json({ error: "Missing topic or prompt" }, { status: 400 });
  }

  const targetWords = minutesToWords(Math.min(12, Math.max(3, minutes || 5)));
  const system = sysPrompt(minutes, targetWords);
  const user0 = `Topic: ${topic}\nBrief: ${prompt}\nReturn strict JSON only.`;

  let title = "Untitled";
  let dek = "";
  let bodyMarkdown = "";
  let tags: string[] = [];
  let image_prompt = `abstract illustration of ${title}`;
  let sources: Array<{ title: string; url: string; publisher: string; date: string }> = [];

  // Path A: direct OpenAI
  if (process.env.OPENAI_API_KEY) {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || "gpt-5";

    let out1 = "";
    try {
      // Prefer Chat+Schema even for gpt-5; Responses fallback is inside
      out1 = await callModelJSON(client, model, system, user0);
    } catch (e: any) {
      return NextResponse.json(
        { error: "OpenAI chat call failed", detail: String(e?.message || e) },
        { status: 502 }
      );
    }

    // If still empty, fail gracefully with context
    if (!out1 || !out1.trim()) {
      return NextResponse.json(
        { error: "Model returned non-JSON", sample: "" },
        { status: 502 }
      );
    }

    let data: any;
    try {
      data = extractJsonLoose(out1);
    } catch {
      return NextResponse.json(
        { error: "Model returned non-JSON", sample: out1.slice(0, 250) },
        { status: 502 }
      );
    }

    title = String(data.title || title);
    dek = String(data.dek || "");
    bodyMarkdown = String(data.bodyMarkdown || "");
    tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
    image_prompt = String(data.image_prompt || image_prompt);
    sources = Array.isArray(data.sources)
      ? data.sources.map((s: any) => ({
          title: String(s.title || ""),
          url: String(s.url || ""),
          publisher: String(s.publisher || ""),
          date: String(s.date || ""),
        }))
      : [];

    // If short, do one rewrite pass (same multi-shape caller)
    if (countWords(bodyMarkdown) < targetWords) {
      const rewriteUser =
        `Rewrite the FULL article to meet or exceed ${targetWords} words while keeping the JSON schema identical. ` +
        `Keep the same topic and improve depth, add sections and practical detail. Return strict JSON only.\n\n` +
        `Current JSON (fix/expand this):\n` +
        JSON.stringify({ title, dek, bodyMarkdown, tags, image_prompt, sources }, null, 2);

      try {
        const out2 = await callModelJSON(client, model, system, rewriteUser);
        if (out2 && out2.trim()) {
          const data2 = extractJsonLoose(out2);
          title = String(data2.title || title);
          dek = String(data2.dek || dek);
          bodyMarkdown = String(data2.bodyMarkdown || bodyMarkdown);
          tags = Array.isArray(data2.tags) ? data2.tags.map(String) : tags;
          image_prompt = String(data2.image_prompt || image_prompt);
          sources = Array.isArray(data2.sources)
            ? data2.sources.map((s: any) => ({
                title: String(s.title || ""),
                url: String(s.url || ""),
                publisher: String(s.publisher || ""),
                date: String(s.date || ""),
              }))
            : sources;
        }
      } catch {
        // keep first pass
      }
    }
  } else {
    // Path B: proxy
    const API_RAW = process.env.AI_GENERATE_URL || process.env.AI_API_URL;
    if (!API_RAW) {
      return NextResponse.json(
        { error: "Server misconfigured: set OPENAI_API_KEY, or AI_GENERATE_URL/AI_API_URL" },
        { status: 500 }
      );
    }
    const API = toAbsoluteURL(API_RAW);
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (process.env.AI_API_KEY) headers.authorization = `Bearer ${process.env.AI_API_KEY}`;

    // Try proxy in Chat JSON mode; then retry without response_format
    let attempt = await callProxyJSON(API, headers, {
      messages: [
        { role: "system", content: system },
        { role: "user", content: user0 },
      ],
      response_format: { type: "json_object" },
    });
    if (!attempt.ok && /response_format|json_object/i.test(attempt.text)) {
      attempt = await callProxyJSON(API, headers, {
        messages: [
          { role: "system", content: system },
          { role: "user", content: user0 },
        ],
      });
    }
    if (!attempt.ok) {
      return NextResponse.json(
        { error: "Upstream error", status: attempt.status, detail: attempt.text },
        { status: 502 }
      );
    }

    let raw = attempt.text;
    if (!raw || !raw.trim()) {
      const second = await callProxyJSON(API, headers, {
        messages: [
          { role: "system", content: system + "\nReturn ONLY a JSON object. No prose." },
          { role: "user", content: user0 },
        ],
      });
      if (!second.ok) {
        return NextResponse.json(
          { error: "Upstream error", status: second.status, detail: second.text },
          { status: 502 }
        );
      }
      raw = second.text;
    }

    let data: any;
    try {
      data = extractJsonLoose(raw);
    } catch {
      return NextResponse.json(
        { error: "Proxy returned non-JSON", sample: (raw || "").slice(0, 250) },
        { status: 502 }
      );
    }

    title = String(data.title || title);
    dek = String(data.dek || "");
    bodyMarkdown = String(data.bodyMarkdown || "");
    tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
    image_prompt = String(data.image_prompt || image_prompt);
    sources = Array.isArray(data.sources)
      ? data.sources.map((s: any) => ({
          title: String(s.title || ""),
          url: String(s.url || ""),
          publisher: String(s.publisher || ""),
          date: String(s.date || ""),
        }))
      : [];
  }

  if (!Array.isArray(sources) || sources.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 sources", got: sources?.length ?? 0 },
      { status: 400 }
    );
  }

  const topicSlug = labelToTopicSlug(topic) ?? (topic as any);

  return NextResponse.json({
    title,
    dek,
    bodyMarkdown,
    tags,
    image_prompt,
    sources,
    topic,
    topicSlug,
    targetWords,
  });
}
