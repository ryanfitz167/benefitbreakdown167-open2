// FILE: app/page.tsx
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { TOPICS as RAW_TOPICS, TOPIC_BLURBS } from "@/lib/topics";

function fmtDate(input?: string | null): string {
  if (!input) return "";
  const t = Date.parse(input);
  return Number.isNaN(t) ? "" : new Date(t).toLocaleDateString();
}

type UITopic = { href: string; label: string; blurb: string; accent?: boolean };

// Build UI topics from canonical list, then append Ask AI
const UI_TOPICS: UITopic[] = [
  ...RAW_TOPICS.map((t) => ({
    href: `/topics/${t.slug}`,
    label: t.title,
    blurb: TOPIC_BLURBS[t.slug] ?? "",
  })),
  // Ask AI button (last, accent)
  { href: "/ask-ai", label: "Ask AI", blurb: "Ask benefits questions", accent: true },
];

export default function HomePage() {
  const all = getAllPosts();
  const recent = all.slice(0, 6);

  return (
    <main className="max-w-[1100px] mx-auto my-8 px-4">
      <section className="border border-neutral-200 rounded-2xl p-6 mb-6 bg-neutral-50">
        <h1 className="m-0 text-2xl font-semibold">Benefit Breakdown</h1>
        <p className="m-0 mt-2 text-[15px] text-neutral-700">
          A practical guide to benefits: plain-English explanations, compliance notes, definitions, and step-by-step guides.
          Explore topics below or jump into the latest posts.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-[1fr,320px]">
        <section>
          <h2 className="m-0 mb-3 text-xl font-semibold">Explore Topics</h2>
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
            {UI_TOPICS.map((t) => (
              <li
                key={t.href}
                className={`border rounded-xl p-4 ${
                  t.accent ? "bg-black text-white border-black" : "bg-white border-neutral-200"
                }`}
              >
                <Link
                  href={t.href}
                  className={`no-underline font-semibold hover:opacity-80 ${t.accent ? "text-white" : ""}`}
                >
                  {t.label}
                </Link>
                {t.blurb && (
                  <div className={`text-sm mt-1 ${t.accent ? "text-neutral-200" : "text-neutral-600"}`}>
                    {t.blurb}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        <aside className="md:sticky md:top-4 h-fit">
          <h3 className="m-0 mb-3 text-lg font-semibold">Recently published</h3>
          <ul className="list-none p-0 m-0 divide-y divide-neutral-200">
            {recent.map((p) => (
              <li key={p.slug} className="py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/blog/${p.slug}`} className="no-underline hover:opacity-80">
                      <h4 className="m-0 text-[15px] font-medium truncate">{p.title}</h4>
                    </Link>
                    <div className="text-xs text-neutral-500 mt-1">{fmtDate(p.date)}</div>
                    {p.description && (
                      <p className="text-sm text-neutral-700 mt-1 line-clamp-2">{p.description}</p>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500 whitespace-nowrap">{p.readingTime}</div>
                </div>
              </li>
            ))}
            {recent.length === 0 && (
              <li className="py-8 text-sm text-neutral-500">No recent posts yet.</li>
            )}
          </ul>
        </aside>
      </div>
    </main>
  );
}
