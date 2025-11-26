// components/HeaderNav.tsx (Server Component)
import Link from "next/link";
import { getSubtopicsByCategory } from "@/lib/articles";

const CATEGORIES: Array<{ slug: string; label: string }> = [
  { slug: "compliance", label: "Compliance" },
  // add more top-level categories here as you create them
];

const categoryPath = (c: string) => `/category/${encodeURIComponent(c)}`;
const subtopicPath  = (c: string, s: string) => `/category/${encodeURIComponent(c)}/${encodeURIComponent(s)}`;

export default async function HeaderNav() {
  // prefetch subtopics for hover menus
  const subtopicsByCat = Object.fromEntries(
    await Promise.all(
      CATEGORIES.map(async (c) => [c.slug, await getSubtopicsByCategory(c.slug)])
    )
  );

  return (
    <nav className="border-b bg-white">
      <div className="container flex h-14 items-center gap-6">
        <Link href="/" className="font-bold tracking-tight">Benefit Breakdown</Link>

        <ul className="flex items-center gap-4">
          {CATEGORIES.map((c) => {
            const subs = subtopicsByCat[c.slug] || [];
            return (
              <li key={c.slug} className="relative group">
                <Link
                  href={categoryPath(c.slug)} // ← canonical “All {Category}”
                  className="capitalize text-slate-700 hover:text-blue-700"
                >
                  {c.label}
                </Link>

                {/* Hover dropdown (only if there are subtopics) */}
                {subs.length > 0 && (
                  <div className="pointer-events-none absolute left-0 top-full z-50 hidden min-w-[220px] group-hover:block">
                    <div className="pointer-events-auto mt-2 rounded-xl border bg-white p-2 shadow-xl">
                      <ul>
                        {subs.map((s) => (
                          <li key={s}>
                            <Link
                              href={subtopicPath(c.slug, s)}
                              className="block rounded-lg px-3 py-2 text-sm capitalize text-slate-700 hover:bg-slate-50 hover:text-blue-700"
                            >
                              {s}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
