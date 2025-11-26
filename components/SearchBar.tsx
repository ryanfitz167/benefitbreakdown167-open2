"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Item = {
  slug: string;
  title: string;
  excerpt: string;
  tags?: string[];
  date?: string;
  url: string;
};

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// highlight `q` inside text
function highlight(text: string, q: string) {
  const parts = q
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(escapeRegExp);
  if (!parts.length) return text;
  const re = new RegExp(`(${parts.join("|")})`, "ig");
  const segments = text.split(re);
  return segments.map((seg, i) =>
    re.test(seg) ? (
      <mark key={i} className="bg-yellow-200 rounded px-0.5">
        {seg}
      </mark>
    ) : (
      <span key={i}>{seg}</span>
    )
  );
}

export default function SearchBar() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [allTags, setAllTags] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [range, setRange] = useState<"any" | "30d" | "90d" | "year">("any");

  useEffect(() => {
    // fetch available tags (once)
    fetch("/api/tags", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAllTags(d?.tags ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const dates = useMemo(() => {
    if (range === "any") return { from: undefined as string | undefined, to: undefined as string | undefined };
    const now = new Date();
    const to = now.toISOString().slice(0, 10);
    const fromDate = new Date(now);
    if (range === "30d") fromDate.setDate(now.getDate() - 30);
    if (range === "90d") fromDate.setDate(now.getDate() - 90);
    if (range === "year") fromDate.setFullYear(now.getFullYear() - 1);
    const from = fromDate.toISOString().slice(0, 10);
    return { from, to };
  }, [range]);

  // query API whenever q/tags/range change
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!debounced) {
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: debounced });
        activeTags.forEach((t) => params.append("tag", t));
        if (dates.from) params.set("from", dates.from);
        if (dates.to) params.set("to", dates.to);

        const res = await fetch(`/api/search?${params.toString()}`, { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setItems(data?.items ?? []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [debounced, activeTags, dates]);

  function toggleTag(t: string) {
    setActiveTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Row: input + range */}
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search benefits, compliance, acronyms…"
          className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as any)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          title="Date range"
        >
          <option value="any">Any time</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="year">Last year</option>
        </select>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {allTags.slice(0, 16).map((t) => {
            const active = activeTags.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={
                  "rounded-full border px-3 py-1 text-xs " +
                  (active
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-300 hover:bg-slate-50")
                }
              >
                {t}
              </button>
            );
          })}
        </div>
      )}

      {/* Results panel */}
      {q && (
        <div className="relative">
          <div className="absolute z-20 mt-2 w-full rounded-xl border bg-white shadow">
            <div className="flex items-center justify-between border-b px-3 py-2 text-xs text-slate-500">
              <span>{loading ? "Searching…" : `${items.length} result${items.length === 1 ? "" : "s"}`}</span>
              {(activeTags.length > 0 || range !== "any") && (
                <button
                  className="underline"
                  onClick={() => {
                    setActiveTags([]);
                    setRange("any");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>

            {!loading && items.length === 0 && (
              <div className="p-3 text-sm text-slate-500">No results</div>
            )}

            {!loading &&
              items.slice(0, 10).map((it) => (
                <Link key={it.slug} href={it.url} className="block p-3 hover:bg-slate-50">
                  <div className="text-sm font-medium">
                    {highlight(it.title, debounced)}
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-2">
                    {highlight(it.excerpt, debounced)}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                    {it.tags?.slice(0, 4).map((t) => (
                      <span key={t} className="rounded-full border px-2 py-0.5">
                        {t}
                      </span>
                    ))}
                    {it.date && <span>• {new Date(it.date).toLocaleDateString()}</span>}
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

