// app/api/admin/articles/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "articles.json");

function coerceToArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    if (Array.isArray((raw as any).articles)) return (raw as any).articles;
    if ("slug" in raw || "title" in raw) return [raw];
  }
  return [];
}
function slugify(input: string) {
  return String(input || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const title: string = String(body.title || "");
    const category: string = String(body.category || "").trim().toLowerCase();
    const subtopic: string = String(body.subtopic || body.subcategory || "").trim().toLowerCase();
    let slug: string = String(body.slug || "");
    const published: boolean = Boolean(body.published);
    const publishedAt: string =
      String(body.publishedAt || (published ? new Date().toISOString() : "")).trim() ||
      new Date().toISOString();
    const contentHtml: string = String(body.contentHtml || "");

    const heroImageUrl: string | undefined = body.heroImageUrl ? String(body.heroImageUrl) : undefined;
    const heroImageAlt: string | undefined = body.heroImageAlt ? String(body.heroImageAlt) : undefined;

    const sources: Array<{ url: string; title?: string }> = Array.isArray(body.sources)
      ? body.sources.map((s: any) => ({ url: String(s.url), title: s.title ? String(s.title) : undefined }))
      : [];

    if (!title || !category || !subtopic) {
      return NextResponse.json({ error: "title, category, subtopic are required" }, { status: 400 });
    }
    if (!slug) slug = slugify(title);

    const raw = await fs.readFile(DATA_FILE, "utf8").catch(() => "[]");
    const arr = coerceToArray(JSON.parse(raw));

    const idx = arr.findIndex((a: any) => String(a.slug || "") === slug);
    const record = {
      ...(idx >= 0 ? arr[idx] : {}),
      id: (idx >= 0 ? arr[idx].id : slug) as string,
      title,
      category,
      subtopic,
      slug,
      contentHtml,
      published,
      publishedAt,
      heroImageUrl,
      heroImageAlt,
      sources,
    };

    if (idx >= 0) arr[idx] = record;
    else arr.unshift(record);

    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(arr, null, 2), "utf8");

    return NextResponse.json({ ok: true, slug, record });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save article" }, { status: 500 });
  }
}
