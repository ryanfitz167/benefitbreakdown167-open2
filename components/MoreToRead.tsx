import Link from "next/link";

type Item = {
  slug: string;
  meta: {
    title: string;
    description?: string;
    date: string;
    category?: string;
  };
};

export default function MoreToRead({
  items,
  title = "More to read",
}: {
  items: Item[];
  title?: string;
}) {
  if (!items?.length) return null;

  return (
    <section className="mt-12 border-t pt-8">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ul className="space-y-6">
        {items.map((p) => (
          <li key={p.slug} className="group">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              {p.meta.category}
            </p>
            <Link
              href={`/blog/${p.slug}`}
              className="block text-base font-semibold leading-6 group-hover:underline"
            >
              {p.meta.title}
            </Link>
            {p.meta.description && (
              <p className="mt-1 text-sm text-neutral-600">
                {p.meta.description}
              </p>
            )}
            <p className="mt-1 text-xs text-neutral-500">
              {new Date(p.meta.date).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
