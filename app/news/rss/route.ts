// app/news/rss/route.ts
export const runtime = "nodejs";
export const dynamic = "force-static";

import { NextResponse } from "next/server";
import { getAllArticles } from "@/lib/news";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const items = getAllArticles()
    .map((a) => {
      const link = `${baseUrl}/news/${a.slug}`;
      const pubDate = new Date(a.date).toUTCString();
      const desc = a.summary || "";
      return `
  <item>
    <title><![CDATA[${a.title}]]></title>
    <link>${link}</link>
    <guid>${link}</guid>
    <pubDate>${pubDate}</pubDate>
    <description><![CDATA[${desc}]]></description>
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Benefit Breakdown — News</title>
  <link>${baseUrl}/news</link>
  <description>Headlines that affect coverage</description>
  ${items}
</channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
