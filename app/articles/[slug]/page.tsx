// FILE: app/articles/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import { getAllPosts, getPostBySlug, type PostSummary } from "@/lib/posts";

// Helpers
function toSlug(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}
function intersect(a: string[], b: string[]): boolean {
  if (!a.length || !b.length) return false;
  const set = new Set(a.map((x) => x.toLowerCase()));
  return b.some((y) => set.has(y.toLowerCase()));
}

// SSG params
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const posts = getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

// SEO
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  return {
    title: `${post.meta.title} · Benefit Breakdown`,
    description: post.meta.description ?? "",
  };
}

// Page
export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;
  const post = getPostBySlug(slug);

  const tags: string[] = Array.isArray(post.meta.tags) ? post.meta.tags : [];

  // Compile MDX
  const { content: MDXContent } = await compileMDX({
    source: post.content,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      },
    },
  });

  // Related: share at least one tag, exclude current; fallback to latest
  const all = getAllPosts();
  let related: PostSummary[] = all
    .filter((p) => p.slug !== post.slug && intersect(p.tags ?? [], tags))
    .slice(0, 6);

  if (related.length === 0) {
    related = all.filter((p) => p.slug !== post.slug).slice(0, 6);
  }

  return (
    <div className="space-y-10">
      <article className="prose prose-neutral max-w-3xl mx-auto">
        <h1 className="mb-0">{post.meta.title}</h1>
        <p className="mt-0 text-sm text-fog">
          {new Date(post.meta.date).toLocaleDateString()} • {post.meta.readingTime}
        </p>
        <div className="separator my-6" />
        {MDXContent}
        {tags.length > 0 && (
          <p className="mt-8 text-sm text-fog">
            Tags:{" "}
            {tags.map((t, i) => (
              <Link
                key={t}
                href={`/${toSlug(t)}`}
                className="underline underline-offset-4 hover:opacity-80"
              >
                {t}
                {i < tags.length - 1 ? ", " : ""}
              </Link>
            ))}
          </p>
        )}
      </article>

      {related.length > 0 && (
        <section className="container-1440">
          <h2 className="text-xl font-semibold mb-4">Related</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((p) => (
              <Link key={p.slug} href={`/articles/${p.slug}`} className="block group">
                <article className="space-y-2">
                  <div className="aspect-[16/10] rounded-xl bg-neutral-100" />
                  <h3 className="text-lg font-semibold group-hover:opacity-80">{p.title}</h3>
                  <p className="text-sm text-fog line-clamp-2">{p.description}</p>
                  <div className="text-xs text-fog">
                    {new Date(p.date).toLocaleDateString()} • {p.readingTime}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
