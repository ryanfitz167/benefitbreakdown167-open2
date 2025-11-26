// FILE: app/topics/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { getTrendingSlugs } from "@/lib/views";
import { TOPICS, type TopicSlug, slugToTitle } from "@/lib/topics";

export const dynamic = "force-dynamic"; // Trending depends on live view counts.

export async function generateStaticParams() {
  return TOPICS.map((t) => ({ slug: t.slug }));
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k views`;
  return `${n} views`;
}

export default function TopicPage({ params }: { params: { slug: string } }) {
  const isKnown = TOPICS.some((t) => t.slug === params.slug);
  if (!isKnown) return notFound();

  const slug = params.slug as TopicSlug;
  const all = getAllPosts(); // PostSummary[]

  let items: Array<{
    slug: string;
    title: string;
    date?: string | null;
    description?: string;
    metaRight?: string;
  }> = [];

  if (slug === "trending") {
    const trending = getTrendingSlugs(12); // [{slug, views}]
    if (trending.length === 0) {
      // Fallback: newest if no views yet.
      items = all.slice(0, 12).map((p) => ({
        slug: p.slug,
        title: p.title,
        date: p.date,
        description: p.description,
        metaRight: p.readingTime,
      }));
    } else {
      items = trending
        .map(({ slug: s, views }) => {
          try {
            const post = getPostBySlug(s);
            return {
              slug: post.slug,
              title: post.meta.title ?? post.slug,
              date: post.meta.date ?? null,
              description: post.meta.description ?? "",
              metaRight: formatViews(views),
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean) as typeof items;
    }
  } else {
    // Filter by per-post meta.topicSlug
    items = all
      .filter((p) => {
        try {
          const full = getPostBySlug(p.slug);
          return full.meta.topicSlug === slug;
        } catch {
          return false;
        }
      })
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        date: p.date,
        description: p.description,
        metaRight: p.readingTime,
      }));
  }

  return (
    <main className="max-w-5xl mx-auto px-4 my-8">
      <h1 className="mb-1 text-2xl font-semibold">{slugToTitle(slug)}</h1>
      <p className="text-sm text-fog mb-6">
        {slug === "trending" ? "Most viewed across the site." : `Articles under ${slugToTitle(slug)}.`}
      </p>

      <ul className="divide-y divide-neutral-200">
        {items.map((p) => (
          <li key={p.slug} className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Link href={`/blog/${p.slug}`} className="no-underline hover:opacity-80">
                  <h3 className="m-0 text-lg font-medium truncate">{p.title}</h3>
                </Link>
                <div className="text-xs text-fog mt-1">
                  {p.date ? new Date(p.date).toLocaleDateString() : ""}
                </div>
                {p.description && (
                  <p className="text-sm text-neutral-700 mt-2 line-clamp-2">{p.description}</p>
                )}
              </div>
              <div className="text-xs text-fog whitespace-nowrap">{p.metaRight}</div>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="py-8 text-sm text-fog">No articles yet.</li>}
      </ul>
    </main>
  );
}
