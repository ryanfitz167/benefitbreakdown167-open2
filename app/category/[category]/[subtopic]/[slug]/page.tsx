import AdSlot from "@/components/AdSlot";
import { getArticle } from "@/lib/articles";
import { buildArticleMetadata, articleJsonLd } from "@/lib/seo";

// Choose two AdSense slot IDs now (or keep placeholders)
const MID_ARTICLE_SLOT = "1234567890";
const END_ARTICLE_SLOT = "0987654321";

type Params = { category: string; subtopic: string; slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { category, subtopic, slug } = await params;
  const article = await getArticle({ category, subtopic, slug });
  if (!article) return {};
  return buildArticleMetadata({
    title: article.title,
    description: undefined,
    category: article.category,
    subtopic: article.subtopic,
    slug: article.slug,
    heroImage: article.heroImageUrl,
  });
}

/** Split HTML roughly in half at paragraph boundaries for a “mid-article” insertion */
function splitHtmlAtMiddle(contentHtml: string): { first: string; second: string } {
  const parts = contentHtml.split(/<\/p>\s*/i);
  if (parts.length < 3) return { first: contentHtml, second: "" };

  const midpoint = Math.floor(parts.length / 2);

  const first = parts.slice(0, midpoint).join("</p>\n") + "</p>";
  const second = parts.slice(midpoint).join("</p>\n");
  return { first, second };
}

export default async function ArticleWithSubtopic({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category, subtopic, slug } = await params;
  const article = await getArticle({ category, subtopic, slug });
  if (!article) {
    return (
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold">Article not found</h1>
      </main>
    );
  }

  const jsonLd = articleJsonLd({
    title: article.title,
    description: undefined,
    category: article.category,
    subtopic: article.subtopic,
    slug: article.slug,
    publishedAt: article.publishedAt,
    heroImage: article.heroImageUrl,
  });

  // Only render ad wrappers if AdSense client is configured
  const adsEnabled = !!process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  const { first, second } = splitHtmlAtMiddle(article.contentHtml);

  return (
    <main className="container mx-auto px-4 py-8 lg:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="mb-6 lg:mb-8">
        <p className="text-xs tracking-wide text-slate-500">
          {category.toUpperCase()} • {subtopic}
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900 lg:text-5xl">
          {article.title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Updated {new Date(article.publishedAt).toLocaleDateString()}
        </p>
      </header>

      {article.heroImageUrl && (
        <figure className="mb-8 overflow-hidden rounded-2xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.heroImageUrl} alt={article.heroImageAlt || ""} className="w-full" />
        </figure>
      )}

      <article className="prose prose-slate lg:prose-lg max-w-none">
        {/* First half */}
        <div dangerouslySetInnerHTML={{ __html: first }} />

        {/* Mid-article ad (conditional wrapper to avoid empty spacing before ads are enabled) */}
        {adsEnabled && (
          <div className="my-10 not-prose">
            <AdSlot slot={MID_ARTICLE_SLOT} />
          </div>
        )}

        {/* Second half */}
        <div dangerouslySetInnerHTML={{ __html: second || "" }} />

        {/* End-of-article ad */}
        {adsEnabled && (
          <div className="mt-10 not-prose">
            <AdSlot slot={END_ARTICLE_SLOT} />
          </div>
        )}
      </article>
    </main>
  );
}

