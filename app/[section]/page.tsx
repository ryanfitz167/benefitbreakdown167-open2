// FILE: app/[section]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getAllTags, getPostsByTag, type PostSummary } from "@/lib/posts"; // ensure lib/posts.ts exists

// Why: consistent URL slugs
function toSlug(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}
function fromSlug(s: string): string {
  return s.replace(/-/g, " ");
}

export async function generateStaticParams(): Promise<Array<{ section: string }>> {
  const tags: string[] = getAllTags();
  return tags.map((tag: string) => ({ section: toSlug(tag) }));
}

export async function generateMetadata({
  params,
}: {
  params: { section: string };
}): Promise<Metadata> {
  return { title: `${fromSlug(params.section)} · Benefit Breakdown` };
}

export default async function SectionPage({
  params,
}: {
  params: { section: string };
}) {
  const sectionSlug: string = params.section;

  // Map slug back to canonical tag casing if present
  const allTags: string[] = getAllTags();
  const canonicalTag: string =
    allTags.find((tag: string) => toSlug(tag) === sectionSlug) ?? fromSlug(sectionSlug);

  const posts: PostSummary[] = getPostsByTag(canonicalTag); // getPostsByTag is case-insensitive in lib/posts.ts

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold capitalize">
        {fromSlug(sectionSlug)}
      </h1>

      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((p: PostSummary) => (
          <Link key={p.slug} href={`/articles/${p.slug}`} className="block group">
            <article className="space-y-2">
              <div className="aspect-[16/10] rounded-xl bg-neutral-100" />
              <h2 className="text-lg font-semibold group-hover:opacity-80">{p.title}</h2>
              <p className="text-sm text-fog line-clamp-2">{p.description}</p>
              <div className="text-xs text-fog">
                {new Date(p.date).toLocaleDateString()} • {p.readingTime}
              </div>
            </article>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <p className="text-fog">No posts yet in this section.</p>
      )}
    </div>
  );
}
