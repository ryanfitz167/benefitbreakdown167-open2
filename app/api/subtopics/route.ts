// app/api/subtopics/route.ts
import { NextResponse } from "next/server";
import { getSubtopicsByCategory } from "@/lib/articles";
import { SUBTOPIC_OPTIONS } from "@/lib/navOptions";
import slugify from "slugify";

const toSlug = (s: string) => slugify(s || "", { lower: true, strict: true });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = toSlug(searchParams.get("category") || "");

  // static suggestions (slugs)
  const staticSubs = (SUBTOPIC_OPTIONS[category] || []).map((s) => toSlug(s));

  // discovered (turn whatever names are on disk/data into slugs)
  const discoveredRaw = await getSubtopicsByCategory(category);
  const discovered = (discoveredRaw || []).map(toSlug);

  const merged = Array.from(new Set([...staticSubs, ...discovered])).sort((a, b) =>
    a.localeCompare(b)
  );

  return NextResponse.json({ subtopics: merged });
}


