// FILE: app/api/debug/posts/route.ts
import { NextResponse } from "next/server";
import path from "node:path";
import { getAllPosts, getPostBySlug, POSTS_PATH, type PostSummary } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toSlug(s?: string | null): string {
  return String(s ?? "").trim().toLowerCase().replace(/\s+/g, "-");
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Math.max(1, Number(limitParam)) : undefined;

    const summaries: PostSummary[] = getAllPosts();
    const slice = typeof limit === "number" ? summaries.slice(0, limit) : summaries;

    const rows = slice.map((p) => {
      const full = getPostBySlug(p.slug); // includes meta + content
      const tags = Array.isArray(full.meta.tags) ? full.meta.tags : [];
      const section = tags.length ? toSlug(tags[0]) : null;
      const fileAbs = path.join(POSTS_PATH, `${full.slug}.mdx`);
      const filepath = path.relative(process.cwd(), fileAbs).replace(/\\/g, "/");

      // Keep a compact frontmatter object for debugging
      const frontmatter = {
        title: full.meta.title,
        date: full.meta.date,
        description: full.meta.description ?? "",
        tags,
        hero: full.meta.hero ?? undefined,
        readingTime: full.meta.readingTime,
        words: full.meta.words,
      };

      return {
        slug: full.slug,
        section,     // previously p.section
        filepath,    // previously p.filepath
        frontmatter, // previously frontmatter
      };
    });

    return NextResponse.json({ ok: true, count: rows.length, posts: rows }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown_error" },
      { status: 500 }
    );
  }
}
