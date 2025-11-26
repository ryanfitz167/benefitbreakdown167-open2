// FILE: app/page.tsx
import Link from "next/link";
import { getAllPosts, type PostSummary } from "@/lib/posts";

export default async function HomePage() {
  const posts: PostSummary[] = getAllPosts();
  const [hero, ...rest] = posts;

  return (
    <div className="space-y-8">
      {hero && (
        <Link href={`/blog/${hero.slug}`} className="block">
          <article className="grid gap-6 md:grid-cols-2">
            <div className="aspect-video rounded-xl bg-neutral-100" />
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
                {hero.title}
              </h1>
              <p className="mt-3 text-fog">{hero.description}</p>
              <div className="mt-3 text-sm text-fog">
                {new Date(hero.date).toLocaleDateString()} • {hero.readingTime}
              </div>
            </div>
          </article>
        </Link>
      )}

      <div className="separator" />

      <section className="grid gap-6 md:grid-cols-3">
        {rest.map((p) => (
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
      </section>

      {posts.length === 0 && (
        <p className="text-fog">No posts found. Add MDX files to <code>/content/posts</code>.</p>
      )}
    </div>
  );
}
