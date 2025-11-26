// app/category/[category]/page.tsx
import Link from "next/link";
import { getArticlesByCategory } from "@/lib/articles";

type Params = { category: string };

export default async function CategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category } = await params; // 👈 await
  const items = await getArticlesByCategory(category);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{category.toUpperCase()}</h1>

      {items.length === 0 ? (
        <p className="text-slate-500">No articles yet.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((a) => (
            <li key={a.id}>
              <Link className="font-semibold hover:underline" href={`/category/${a.category}/${a.subtopic}/${a.slug}`}>
                {a.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
