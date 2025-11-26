// FILE: app/[section]/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { getAllPosts, getPostBySlug, type PostSummary } from "@/lib/posts";

function toSlug(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}
function fromSlug(s: string): string {
  return s.replace(/-/g, " ");
}
function hasTagSlug(post: PostSummary, tagSlug: string): boolean {
  return (post.tags ?? []).some((t) => toSlug(t) === tagSlug);
}

export async function generateStaticParams(): Promise<Array<{ section: string; slug: string }>> {
  const posts = getAllPosts();
  const params: Array<{ section: string; slug: string }> = [];
  for (const p of posts) {
    for (const t of p.tags ?? []) {
      params.push({ section: toSlug(t), slug: p.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: { section: string; slug: string };
}): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  return {
    title: `${post.meta.title} · Benefit Breakdown`,
    description: post.meta.description ?? "",
  };
}

export default async function ArticleInSectionPage({
  params,
}: {
  params: { section: string; slug: string };
}) {
  const sectionSlug: string = params.section;
  const slug: string = params.slug;

  const post = getPostBySlug(slug);

  // Normalize tags to always be an array
  const tags: string[] = Array.isArray(post.meta.tags) ? post.meta.tags : [];

  // If no tags, fallback to canonical /articles route
  if (tags.length === 0) {
    redirect(`/articles/${post.slug}`);
  }

  // Canonicalize section: ensure URL section matches one of the post's tag slugs
  const canonicalTagSlug =
    tags.map(toSlug).find((t) => t === sectionSlug) ?? tags.map(toSlug)[0];

  if (canonicalTagSlug !== sectionSlug) {
    redirect(`/${canonicalTagSlug}/${post.slug}`);
  }

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

  // Related: same tag, exclude current
  const all = getAllPosts();
  const related: PostSummary[] = all
    .filter((p) => p.slug !== post.slug && hasTagSlug(p, canonicalTagSlug))
    .slice(0, 6);

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
              <Link key={t} href={`/${toSlug(t)}`} className="underline underline-offset-4 hover:opacity-80">
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
              <Link key={p.slug} href={`/${canonicalTagSlug}/${p.slug}`} className="block group">
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
