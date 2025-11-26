// app/api/admin/sources/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

function norm(s?: string | null) {
  return (s ?? "").trim();
}

async function extractOne(url: string) {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`Fetch failed (${res.status}) for ${url}`);
  const html = await res.text();
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // Try common meta tags for date/byline
  const meta = (name: string) =>
    doc.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ||
    doc.querySelector(`meta[property="${name}"]`)?.getAttribute("content") ||
    undefined;

  const reader = new Readability(doc);
  const article = reader.parse();

  const hostname = new URL(url).hostname.replace(/^www\./, "");

  return {
    url,
    site: hostname,
    title: norm(article?.title) || norm(doc.title) || hostname,
    byline: norm(article?.byline),
    publishedAt:
      meta("article:published_time") ||
      meta("og:pubdate") ||
      meta("pubdate") ||
      meta("date") ||
      undefined,
    excerpt: norm(article?.excerpt),
    text: norm(article?.textContent) || "",
    html: article?.content || "",
    length: article?.length || 0,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const urls: string[] = Array.isArray(body?.urls)
      ? body.urls
      : String(body?.urls || "")
          .split(/\s|,|\n/)
          .map((s) => s.trim())
          .filter(Boolean);

    if (!urls.length) {
      return NextResponse.json({ error: "No URLs provided." }, { status: 400 });
    }

    const results = [];
    for (const url of urls) {
      try {
        results.push(await extractOne(url));
      } catch (e: any) {
        results.push({ url, error: e?.message || "Extract failed" });
      }
    }

    return NextResponse.json({ ok: true, sources: results });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to process sources" },
      { status: 500 }
    );
  }
}
