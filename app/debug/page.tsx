import { NextResponse } from "next/server";
import { getArticlesByCategory, getArticlesBySubtopic } from "@/lib/articles";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") || "compliance";
  const subtopic = url.searchParams.get("subtopic") || "aca";

  const byCat = await getArticlesByCategory(category);
  const bySub = await getArticlesBySubtopic(category, subtopic);

  return NextResponse.json({
    cwd: process.cwd(),
    category,
    subtopic,
    byCategoryCount: byCat.length,
    bySubtopicCount: bySub.length,
    sample: bySub.slice(0, 5).map((a) => ({
      category: a.category,
      subtopic: a.subtopic,
      slug: a.slug,
      title: a.title,
    })),
  });
}
