// FILE: app/api/views/route.ts
import { NextResponse } from "next/server";
import { incrementView, getTrendingSlugs, getViews } from "@/lib/views";
import { getPostBySlug } from "@/lib/posts";

export async function POST(req: Request) {
  const { slug } = await req.json().catch(() => ({ slug: undefined as string | undefined }));
  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }
  const views = incrementView(slug);
  return NextResponse.json({ slug, views });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const intent = url.searchParams.get("intent");
  if (intent === "trending") {
    const limit = Number(url.searchParams.get("limit") ?? 12);
    const entries = getTrendingSlugs(limit)
      .map(({ slug, views }) => {
        try {
          const post = getPostBySlug(slug);
          return {
            slug: post.slug,
            title: post.meta.title ?? post.slug,
            date: post.meta.date ?? null,
            description: post.meta.description ?? "",
            views,
            topic: post.meta.topicSlug ?? null,
            readingTime: post.meta.readingTime,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return NextResponse.json({ items: entries });
  }

  const slug = url.searchParams.get("slug");
  if (slug) {
    return NextResponse.json({ slug, views: getViews(slug) });
  }

  return NextResponse.json({ error: "Unsupported request" }, { status: 400 });
}