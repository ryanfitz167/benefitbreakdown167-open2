// FILE: lib/searchIndex.ts
// Why: robust, typed search index without the nonexistent `findPostbySlug`.

import { Document } from "flexsearch";
import { getAllPosts, getPostBySlug, type PostSummary } from "@/lib/posts";

// ---------- types ----------
export type SearchDoc = {
  id: string;            // slug
  title: string;
  description: string;
  body: string;          // stripped MDX
  tags: string[];        // original casing
  date: string;          // ISO
};

export type SearchHit = PostSummary & {
  excerpt?: string;
};

// ---------- utils ----------
function toSlug(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}

function stripMarkdown(src: string): string {
  // minimal MD/MDX stripper for indexing
  return src
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\*\*|__/g, "")
    .replace(/\*|_/g, "")
    .replace(/>\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeExcerpt(content: string, q: string, radius = 120): string {
  const clean = stripMarkdown(content);
  const hay = clean.toLowerCase();
  const needle = q.toLowerCase();
  const idx = hay.indexOf(needle);
  if (idx === -1) return clean.slice(0, radius * 2) + (clean.length > radius * 2 ? "…" : "");
  const start = Math.max(0, idx - radius);
  const end = Math.min(clean.length, idx + needle.length + radius);
  const slice = clean.slice(start, end);
  return (start > 0 ? "…" : "") + slice + (end < clean.length ? "…" : "");
}

// ---------- index singleton ----------
let _index: Document<SearchDoc> | null = null;
let _loaded = false;

function createIndex() {
  // Why: Document mode supports multi-field search with per-field indexes.
  return new Document<SearchDoc>({
    document: {
      id: "id",
      index: ["title", "description", "body", "tags"],
      store: ["id"] // store id for retrieval
    },
    tokenize: "forward"
  });
}

function getIndex(): Document<SearchDoc> {
  if (_index) return _index;
  _index = createIndex();
  return _index;
}

// Build/rebuild index from disk
export async function reindex(): Promise<void> {
  const idx = (_index = createIndex());
  const summaries: PostSummary[] = getAllPosts();
  for (const s of summaries) {
    const full = getPostBySlug(s.slug); // includes .content and meta
    const doc: SearchDoc = {
      id: s.slug,
      title: s.title,
      description: s.description ?? "",
      body: stripMarkdown(full.content || ""),
      tags: (s.tags ?? []).slice(),
      date: s.date
    };
    idx.add(doc.id, doc);
  }
  _loaded = true;
}

// Lazy ensure index exists
async function ensureIndex(): Promise<void> {
  if (_loaded && _index) return;
  await reindex();
}

// ---------- search API ----------
export async function searchPosts(query: string, limit = 20): Promise<SearchHit[]> {
  await ensureIndex();
  const idx = getIndex();
  const q = query.trim();
  const base: PostSummary[] = getAllPosts();

  if (!q) return base.slice(0, limit);

  // FlexSearch may return per-field result objects or flat arrays depending on version
  const raw = idx.search(q, { index: ["title", "description", "body", "tags"], limit });
  const ids = new Set<string>();
  const pushIds = (arr: Array<string | number>) => {
    for (const id of arr) ids.add(String(id));
  };
  if (Array.isArray(raw)) {
    for (const entry of raw as any[]) {
      if (Array.isArray(entry?.result)) pushIds(entry.result);
      else if (Array.isArray(entry)) pushIds(entry as any);
    }
  }

  const results: SearchHit[] = [];
  const qLower = q.toLowerCase();
  for (const p of base) {
    if (!ids.has(p.slug)) continue;
    // Build an excerpt from full content
    const full = getPostBySlug(p.slug);
    const excerpt = makeExcerpt(full.content || "", q);
    results.push({ ...p, excerpt });
  }

  // If FlexSearch returns empty (first run or tokenization mismatch), fallback to simple filter
  if (results.length === 0) {
    for (const p of base) {
      const titleHit = p.title.toLowerCase().includes(qLower);
      const descHit = (p.description ?? "").toLowerCase().includes(qLower);
      const tagsHit = (p.tags ?? []).some((t) => toSlug(t) === toSlug(q) || t.toLowerCase().includes(qLower));
      if (titleHit || descHit || tagsHit) {
        const full = getPostBySlug(p.slug);
        results.push({ ...p, excerpt: makeExcerpt(full.content || "", q) });
      }
      if (results.length >= limit) break;
    }
  }

  return results.slice(0, limit);
}
