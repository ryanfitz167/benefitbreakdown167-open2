// app/api/publish/route.ts
import { NextResponse } from "next/server";
import { publishArticle } from "@/actions/generateArticle";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category, subtopic, title, mdx, imageUrl } = body;

    if (!category || !title || !mdx) {
      return NextResponse.json({ error: "category, title, and mdx are required" }, { status: 400 });
    }

    const result = await publishArticle(category, subtopic || undefined, title, mdx, imageUrl);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[publish] error", e);
    return NextResponse.json({ error: "failed to publish" }, { status: 500 });
  }
}
