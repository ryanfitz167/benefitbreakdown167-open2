import Link from "next/link";
import { ArticleMeta } from "@/lib/content";

export function ArticleCard({ article }: { article: ArticleMeta }) {
  return (
    <Link href={`/articles/${article.slug}`} className="block group">
      <article className="space-y-2">
        <div className="aspect-[16/10] rounded-xl bg-neutral-100" />
        <h2 className="text-lg font-semibold group-hover:opacity-80">{article.title}</h2>
        <p className="text-sm text-fog line-clamp-2">{article.description}</p>
        <div className="text-xs text-fog">{new Date(article.date).toLocaleDateString()}</div>
      </article>
    </Link>
  );
}
