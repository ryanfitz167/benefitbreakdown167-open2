// app/search/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Item = {
  slug: string;
  title: string;
  excerpt: string;
  tags?: string[];
  date?: string;
  url: string;
};

// highlight utility
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
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

export default function SearchPage() {
  const params = useSearchParams();

  // read query from URL
  const initialQ = params.get("q") || "";
  const initialTags = params.getAll("tag");
  const initialFrom = params.get("from") || "";
  const initialTo = params.get("to") || "";

  const [q, setQ] = useState(initialQ);
  const [items, setItems] = useState<Item[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>(initialTags);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  // fetch all tags (once)
  useEffect(() => {
    fetch("/api/tags", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAllTags(d?.tags ?? []))
      .catch(() => {});
  }, []);

  // run the search
  useEffect(() => {
    let cancelled = false;
    async function runSearch() {
      if (!q.trim()) {
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        const sp = new URLSearchParams({ q });
        activeTags.forEach((t) => sp.append("tag", t));
        if (from) sp.set("from", from);
        if (to) sp.set("to", to);
        const res = await fetch(`/api/search?${sp.toString()}`, { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setItems(data.items || []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    runSearch();
    return () => {
      cancelled = true;
    };
  }, [q, activeTags, from, to]);

  function toggleTag(t: string) {
    setActiveTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  return (
    <div className="py-8 space-y-6">
      <h1 className="text-3xl font-bold">Search Results</h1>

      {/* Search bar */}
      <div className="flex items-center gap-2 max-w-xl">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search..."
          className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tag + date filters */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 16).map((t) => {
              const active = activeTags.includes(t);
              return (
                <button
                  key={t}
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
        {/* Date range */}
        <div className="flex gap-2 text-sm">
          <div>
            <label className="block text-xs text-slate-500">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded border border-slate-300 px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded border border-slate-300 px-2 py-1"
            />
          </div>
        </div>

        {(activeTags.length || from || to) && (
          <button
            onClick={() => {
              setActiveTags([]);
              setFrom("");
              setTo("");
            }}
            className="underline text-sm ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Status */}
      <div className="text-sm text-slate-500">
        {loading ? "Searching…" : `${items.length} result(s)`}
      </div>

      {/* Results grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Link
            key={it.slug}
            href={it.url}
            className="block rounded-xl border border-slate-200 p-4 hover:shadow-sm"
          >
            <h2 className="font-semibold text-lg">
              {highlight(it.title, q)}
            </h2>
            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
              {highlight(it.excerpt, q)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
              {it.tags?.map((t) => (
                <span key={t} className="rounded-full border px-2 py-0.5">
                  {t}
                </span>
              ))}
              {it.date && (
                <span>• {new Date(it.date).toLocaleDateString()}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

