// FILE: app/blog/[slug]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { getAllPosts, getPostBySlug, type PostSummary } from "@/lib/posts";
import ViewTracker from "@/components/ViewTracker";

/** ---------- Small helpers ---------- */
function toSlug(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}
function shareAnyTag(a: string[], b: string[]): boolean {
  if (!a?.length || !b?.length) return false;
  const set = new Set(a.map((x) => x.toLowerCase()));
  return b.some((y) => set.has(y.toLowerCase()));
}

/** ---------- Ad placeholders (replace with your ad components) ---------- */
function AdBox({ label, size = "rect" }: { label: string; size?: "rect" | "skyscraper" }) {
  const base =
    "flex items-center justify-center rounded-xl border border-dashed border-neutral-300 text-neutral-500 text-xs";
  const dims =
    size === "skyscraper"
      ? "h-[600px] w-full"
      : "h-[250px] w-full"; // Common IAB placeholder sizes
  return (
    <div className={`${base} ${dims} bg-neutral-50`}>
      <span>Ad slot • {label}</span>
    </div>
  );
}

/** ---------- Static params / metadata ---------- */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const posts = getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const post = getPostBySlug(params.slug);
    return {
      title: `${post.meta.title} · Benefit Breakdown`,
      description: post.meta.description ?? "",
      openGraph: {
        title: post.meta.title,
        description: post.meta.description ?? "",
        images: post.meta.heroUrl ? [{ url: post.meta.heroUrl }] : undefined,
      },
      twitter: {
        card: post.meta.heroUrl ? "summary_large_image" : "summary",
        title: post.meta.title,
        description: post.meta.description ?? "",
        images: post.meta.heroUrl ? [post.meta.heroUrl] : undefined,
      },
    };
  } catch {
    return { title: "Post not found · Benefit Breakdown", description: "" };
  }
}

/** ---------- Page ---------- */
export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;

  let post: ReturnType<typeof getPostBySlug>;
  try {
    post = getPostBySlug(slug);
  } catch {
    return notFound();
  }

  const tags: string[] = Array.isArray(post.meta.tags) ? post.meta.tags : [];

  const { content: MDXContent } = await compileMDX({
    source: post.content,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ],
      },
    },
  });

  const all = getAllPosts();
  let related: PostSummary[] = all
    .filter((p) => p.slug !== post.slug && shareAnyTag(p.tags ?? [], tags))
    .slice(0, 6);
  if (related.length === 0) {
    related = all.filter((p) => p.slug !== post.slug).slice(0, 6);
  }

  return (
    <div className="container-1440 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* ---------- Main column ---------- */}
        <main className="lg:col-span-8">
          <article className="prose prose-neutral max-w-none">
            {/* Header */}
            <header className="mb-6">
              <h1 className="mb-1">{post.meta.title}</h1>
              <p className="mt-0 text-sm text-fog">
                {post.meta.date
                  ? new Date(post.meta.date).toLocaleDateString()
                  : ""}{" "}
                • {post.meta.readingTime}
                {post.meta.topicSlug && (
                  <>
                    {" "}
                    •{" "}
                    <Link
                      href={`/topics/${post.meta.topicSlug}`}
                      className="underline underline-offset-4 hover:opacity-80"
                    >
                      {post.meta.topic ?? post.meta.topicSlug}
                    </Link>
                  </>
                )}
              </p>
            </header>

            {/* Hero image (optional) */}
            {post.meta.heroUrl && (
              <figure className="mb-6 overflow-hidden rounded-2xl border">
                <Image
                  src={post.meta.heroUrl}
                  alt={post.meta.title}
                  width={1600}
                  height={840}
                  className="h-auto w-full object-cover"
                  priority
                />
                {post.meta.heroCaption && (
                  <figcaption className="px-4 py-2 text-center text-xs text-fog">
                    {post.meta.heroCaption}
                  </figcaption>
                )}
              </figure>
            )}

            {/* Body (no top ad) */}
            <div className="separator my-6" />
            {MDXContent}

            {/* In-article ad near bottom (kept) */}
            <div className="my-8">
              <AdBox label="In-article (Bottom)" />
            </div>

            {/* Tags */}
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

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-semibold mb-4">Related</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {related.map((p) => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} className="block group">
                    <article className="space-y-2">
                      <div className="aspect-[16/10] rounded-xl bg-neutral-100" />
                      <h3 className="text-lg font-semibold group-hover:opacity-80">
                        {p.title}
                      </h3>
                      <p className="text-sm text-fog line-clamp-2">
                        {p.description}
                      </p>
                      <div className="text-xs text-fog">
                        {p.date ? new Date(p.date).toLocaleDateString() : ""} •{" "}
                        {p.readingTime}
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <ViewTracker slug={post.slug} />
        </main>

        {/* ---------- Sidebar (sticky ads, newsletter, etc.) ---------- */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            <AdBox label="Sidebar Top (300x600)" size="skyscraper" />
            <AdBox label="Sidebar Bottom (300x250)" />
          </div>
        </aside>
      </div>
    </div>
  );
}

