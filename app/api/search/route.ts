// FILE: app/api/search/route.ts
import { NextResponse } from "next/server";
import { getAllPosts, getPostBySlug, type PostSummary } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- helpers ---
function toSlug(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}

function normalizeQuery(q: string | null): string {
  return (q ?? "").trim();
}

function stripMarkdown(src: string): string {
  // minimal MD stripper: headings, code fences, inline md, links/images
  return src
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\*\*|__/g, "")
    .replace(/\*|_/g, "")
    .replace(/>\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeExcerpt(content: string, q: string, radius = 120): string {
  const hay = content.toLowerCase();
  const needle = q.toLowerCase();
  const idx = hay.indexOf(needle);
  const clean = stripMarkdown(content);
  if (idx === -1) return clean.slice(0, radius * 2) + (clean.length > radius * 2 ? "…" : "");
  // map idx to cleaned string roughly by proportion (good enough for preview)
  const approx = Math.min(Math.floor((idx / content.length) * clean.length), clean.length - 1);
  const start = Math.max(0, approx - radius);
  const end = Math.min(clean.length, approx + radius);
  const slice = clean.slice(start, end);
  return (start > 0 ? "…" : "") + slice + (end < clean.length ? "…" : "");
}

// --- GET /api/search?q=&limit=&section= ---
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = normalizeQuery(url.searchParams.get("q"));
    const limitParam = url.searchParams.get("limit");
    const sectionParam = url.searchParams.get("section"); // optional tag to scope search

    const limit = limitParam ? Math.max(1, Number(limitParam)) : 20;
    const scopeTagSlug = sectionParam ? toSlug(sectionParam) : null;

    // 1) Start from summaries (fast)
    let posts: PostSummary[] = getAllPosts();

    // optional scope by tag/section
    if (scopeTagSlug) {
      posts = posts.filter((p) => (p.tags ?? []).some((t) => toSlug(t) === scopeTagSlug));
    }

    // 2) If no query, return most recent summaries
    if (!q) {
      return NextResponse.json(
        {
          ok: true,
          count: Math.min(limit, posts.length),
          results: posts.slice(0, limit),
        },
        { status: 200 },
      );
    }

    // 3) Lightweight ranking: title/description match first; if not enough, use full content
    const qLower = q.toLowerCase();
    const titleDescMatches: PostSummary[] = [];
    const fullTextMatches: Array<PostSummary & { excerpt: string }> = [];

    for (const p of posts) {
      const titleHit = p.title.toLowerCase().includes(qLower);
      const descHit = (p.description ?? "").toLowerCase().includes(qLower);
      if (titleHit || descHit) {
        titleDescMatches.push(p);
        continue;
      }
      // Need content → load full post here (this is where your old code used `p.content`, which doesn't exist on PostSummary)
      const full = getPostBySlug(p.slug); // has { meta, content }
      const body = full.content ?? "";
      if (body.toLowerCase().includes(qLower)) {
        fullTextMatches.push({
          ...p,
          excerpt: makeExcerpt(body, q),
        });
      }
    }

    // 4) Merge and cap
    const ranked: Array<PostSummary & { excerpt?: string }> = [
      ...titleDescMatches.map((p) => ({ ...p, excerpt: p.description || "" })),
      ...fullTextMatches,
    ].slice(0, limit);

    return NextResponse.json(
      {
        ok: true,
        q,
        count: ranked.length,
        results: ranked.map((r) => ({
          slug: r.slug,
          title: r.title,
          date: r.date,
          description: r.description,
          readingTime: r.readingTime,
          tags: r.tags,
          excerpt: r.excerpt,
          href: `/articles/${r.slug}`,
        })),
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown_error" },
      { status: 500 },
    );
  }
}

