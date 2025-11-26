import { listArticles, getAllTopics } from "@/lib/content";
export default async function sitemap() {
  const base = "https://www.benefitbreakdown.com"; // adjust
  const items = await listArticles({ limit: 5000 });
  const topics = (await getAllTopics()).map((t) => ({ url: `${base}/topics/${t}`, lastModified: new Date() }));
  return [
    { url: base, lastModified: new Date() },
    ...items.map((i) => ({ url: `${base}/articles/${i.slug}`, lastModified: new Date(i.date) })),
    ...topics
  ];
}