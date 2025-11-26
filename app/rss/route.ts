import { listArticles } from "@/lib/content";

export async function GET() {
  const site = "https://www.benefitbreakdown.com"; // adjust
  const items = await listArticles({ limit: 100 });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>Benefit Breakdown</title>
<link>${site}</link>
<description>Health insurance, explained.</description>
${items
  .map(
    (i) => `<item>
<title><![CDATA[${i.title}]]></title>
<link>${site}/articles/${i.slug}</link>
<guid>${site}/articles/${i.slug}</guid>
<pubDate>${new Date(i.date).toUTCString()}</pubDate>
<description><![CDATA[${i.description}]]></description>
</item>`
  )
  .join("\n")}
</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}