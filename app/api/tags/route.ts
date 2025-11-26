// FILE: app/api/tags/route.ts
import { NextResponse } from "next/server";
import { getAllPosts, type PostSummary } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Why: consistent tag slugs for URLs.
function toSlug(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const includePosts =
      url.searchParams.get("includePosts") === "1" ||
      url.searchParams.get("includePosts") === "true";

    const posts: PostSummary[] = getAllPosts();

    type TagEntry = {
      count: number;
      posts?: Array<{ slug: string; title: string; date: string }>;
    };

    const map = new Map<string, TagEntry>();

    for (const p of posts) {
      for (const tag of p.tags ?? []) {
        const entry = map.get(tag) ?? {
          count: 0,
          posts: includePosts ? [] : undefined,
        };
        entry.count++;
        if (includePosts && entry.posts && entry.posts.length < 50) {
          entry.posts.push({ slug: p.slug, title: p.title, date: p.date });
        }
        map.set(tag, entry);
      }
    }

    const items = Array.from(map.entries())
      .map(([tag, info]) => ({
        tag,
        slug: toSlug(tag),
        count: info.count,
        posts: info.posts,
      }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

    return NextResponse.json(
      { ok: true, count: items.length, tags: items },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown_error" },
      { status: 500 }
    );
  }
}
