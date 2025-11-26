// FILE: app/blog/[category]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getAllTags, getPostsByTag, type PostSummary } from "@/lib/posts";

function toSlug(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}
function fromSlug(s: string): string {
  return s.replace(/-/g, " ");
}

export async function generateStaticParams(): Promise<Array<{ category: string }>> {
  const tags: string[] = getAllTags();
  return tags.map((t) => ({ category: toSlug(t) }));
}

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  return { title: `${fromSlug(params.category)} · Benefit Breakdown` };
}

export default async function BlogCategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const categorySlug = params.category;

  // Map slug back to canonical tag (preserve original casing if present)
  const allTags = getAllTags();
  const canonicalTag =
    allTags.find((t) => toSlug(t) === categorySlug) ?? fromSlug(categorySlug);

  const posts: PostSummary[] = getPostsByTag(canonicalTag); // lib/posts is case-insensitive

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold capitalize">
        {fromSlug(categorySlug)}
      </h1>

      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="block group">
            <article className="space-y-2">
              <div className="aspect-[16/10] rounded-xl bg-neutral-100" />
              <h2 className="text-lg font-semibold group-hover:opacity-80">
                {p.title}
              </h2>
              <p className="text-sm text-fog line-clamp-2">{p.description}</p>
              <div className="text-xs text-fog">
                {new Date(p.date).toLocaleDateString()} • {p.readingTime}
              </div>
            </article>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <p className="text-fog">No posts yet in this category.</p>
      )}
    </div>
  );
}
