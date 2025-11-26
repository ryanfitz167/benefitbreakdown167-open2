import { getAllPosts } from "@/lib/posts";
import { getSiteUrl } from "@/lib/site";

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const site = getSiteUrl();
  const posts = getAllPosts();

  const items = posts.map((p: any) => {
    const url = `${site}/blog/${p.slug}`;
    const title = escapeXml(p.meta.title || "");
    const desc = escapeXml(p.meta.description || "");
    const pubDate = new Date(p.meta.date).toUTCString();

    return `
      <item>
        <title>${title}</title>
        <link>${url}</link>
        <guid>${url}</guid>
        <pubDate>${pubDate}</pubDate>
        <description>${desc}</description>
      </item>
    `.trim();
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Benefit Breakdown</title>
    <link>${site}</link>
    <description>Plain-English health insurance & benefits insights.</description>
    <language>en-us</language>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
