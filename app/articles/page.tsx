import Link from "next/link";

const ARTICLES = [
  { slug: "trending-2025-health-benefits-watchlist", title: "Trending: The 2025 Health Benefits Watchlist", category: "Trending" },
  { slug: "aca-compliance-2025-essential-checklist", title: "ACA Compliance in 2025: An Essential Employer Checklist", category: "Compliance" },
  { slug: "deductible-vs-oop-plain-english", title: "Deductible vs. Out-of-Pocket Max: A Plain-English Guide", category: "Definitions" },
  { slug: "in-the-news-glp1-coverage-and-costs", title: "In the News: GLP-1 Coverage, Costs, and What Employers Are Doing", category: "In-the-News" },
  { slug: "future-of-benefits-ai-transparency", title: "The Future of Benefits: AI, Price Transparency, and Personalized Plans", category: "Future Possibilities" },
];

export default function ArticlesIndex() {
  return (
    <div className="mx-auto max-w-5xl py-10">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">All Articles</h1>
      <ul className="divide-y">
        {ARTICLES.map(a => (
          <li key={a.slug} className="py-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">{a.category}</p>
                <Link href={`/articles/${a.slug}`} className="text-lg font-semibold hover:underline">
                  {a.title}
                </Link>
              </div>
              <Link href={`/articles/${a.slug}`} className="text-sm font-medium text-blue-600 hover:underline">
                Read →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
