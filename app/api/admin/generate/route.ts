// app/api/admin/generate/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

type InSource = { url: string; title?: string; text?: string };

function sentences(text: string) {
  const compact = String(text || "").replace(/\s+/g, " ").trim();
  const matches = compact.match(/[^.!?]+[.!?]+/g) || [];
  return matches.map((s) => s.trim());
}
const escapeHtml = (s: string) =>
  String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const para = (s: string) => `<p>${escapeHtml(s)}</p>`;

function groupIntoParagraphs(lines: string[], targetParas: number) {
  const paras: string[] = [];
  let i = 0;
  const per = Math.max(3, Math.ceil(lines.length / Math.max(1, targetParas)));
  while (i < lines.length && paras.length < targetParas) {
    const chunk = lines.slice(i, i + per);
    paras.push(para(chunk.join(" ")));
    i += per;
  }
  return paras;
}

async function localSynthesis(
  title: string,
  guidelines: string,
  sources: InSource[],
  minWords = 900,
  maxWords = 1500
) {
  // Build a pool of sentences from sources + guidelines
  let pool: string[] = [];
  for (const s of sources) pool.push(...sentences(s.text || ""));
  if (guidelines) {
    // split guidelines into pseudo-sentences to seed content if sources are thin
    pool.push(...sentences(guidelines));
  }
  // Deduplicate roughly
  const seen = new Set<string>();
  pool = pool.filter((t) => {
    const key = t.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // If still empty, make a minimal scaffold from the title/guidelines
  if (!pool.length) {
    pool = [
      `${title}—context and implications for benefits and compliance stakeholders.`,
      `This overview summarizes what is happening, why it matters, and practical next steps to consider.`,
    ];
  }

  // Approx: 15 paragraphs tends to land ~900–1500 words for average sentence lengths
  const goalParas = 15;
  const paras = groupIntoParagraphs(pool, goalParas);

  const guidelinesBlock = guidelines
    ? `<h2>Author intent</h2>${para(guidelines)}`
    : "";

  const html =
    `<p class="lead">${escapeHtml(
      title
    )} — synthesized from provided sources and domain knowledge.</p>` +
    (guidelinesBlock || "") +
    `<h2>What’s happening</h2>${paras.slice(0, 5).join("")}` +
    `<h2>Why it matters</h2>${paras.slice(5, 10).join("")}` +
    `<h2>What to do</h2>${paras.slice(10).join("")}`;

  return html;
}

async function llmSynthesis(
  title: string,
  guidelines: string,
  sources: InSource[],
  minWords = 1000,
  maxWords = 2000
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const sourceDigest = sources
    .map(
      (s, i) =>
        `(${i + 1}) ${s.title || s.url}\n${String(s.text || "").slice(0, 3000)}`
    )
    .join("\n\n");

  const prompt = `
Write a clear, accurate U.S. health benefits/compliance article in HTML, ${minWords}-${maxWords} words (~3–5 minute read).
Structure:
- <p class="lead"> one-paragraph summary
- <h2>What’s happening</h2> 3–5 concise paragraphs
- <h2>Why it matters</h2> 3–5 concise paragraphs
- <h2>What to do</h2> 3–5 concise paragraphs

Blend BOTH the provided sources AND your general knowledge. Do not contradict sources.

Title: ${title}
Author guidelines: ${guidelines || "(none provided)"}

Sources (quote/or paraphrase; do not hallucinate):
${sourceDigest || "(no sources provided—use general knowledge and guidelines)"} 
`.trim();

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content:
              "You are a senior U.S. health benefits/compliance writer. Return strictly HTML (fragment only; no <html> or <body>).",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "LLM call failed");
    const html = data?.choices?.[0]?.message?.content?.trim();
    if (!html) throw new Error("Empty LLM response");
    return html;
  } catch {
    return null; // fall back to local
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title: string = String(body?.title || "Draft");
    const guidelines: string = String(body?.guidelines || "");
    const useLLM: boolean = Boolean(body?.useLLM);
    const sources: InSource[] = Array.isArray(body?.sources) ? body.sources : [];
    const minWords = Number(body?.minWords ?? 900);
    const maxWords = Number(body?.maxWords ?? 1500);

    // Allow: guidelines-only OR sources+guidelines
    if (!sources.length && !guidelines.trim()) {
      return NextResponse.json(
        { error: "Provide at least Guidelines or one Source." },
        { status: 400 }
      );
    }

    let html: string | null = null;
    if (useLLM) {
      html = await llmSynthesis(title, guidelines, sources, minWords, maxWords);
    }
    if (!html) {
      html = await localSynthesis(title, guidelines, sources, minWords, maxWords);
    }

    return NextResponse.json({
      ok: true,
      draft: { title, contentHtml: html },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to generate draft" },
      { status: 500 }
    );
  }
}
