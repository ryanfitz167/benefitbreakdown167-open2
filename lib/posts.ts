import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export const POSTS_PATH = path.join(process.cwd(), "content", "posts");

export type PostMeta = {
  title: string;
  description?: string;
  date: string;            // ISO
  readingTime: string;     // e.g., "5 min read"
  tags?: string[];
  topic?: string;
  topicSlug?: string;

  /** Optional hero image fields used by app/blog/[slug]/page.tsx */
  heroUrl?: string;
  heroCaption?: string;
  heroAlt?: string;
};

export type Post = {
  slug: string;
  content: string;
  meta: PostMeta;
};

export type PostSummary = {
  slug: string;
  title: string;
  description?: string;
  date: string;
  readingTime: string;
  tags?: string[];
  /** Handy if you show thumbs in lists later */
  heroUrl?: string;
};

/* -------------------- utils -------------------- */

function readingTimeLite(text: string, wpm = 200): string {
  // Avoids external dependencies; quick & stable.
  const words = (text.trim().match(/\S+/g) ?? []).length;
  const minutes = Math.max(1, Math.round(words / wpm));
  return `${minutes} min read`;
}

function ensurePostsDir(): void {
  if (!fs.existsSync(POSTS_PATH)) fs.mkdirSync(POSTS_PATH, { recursive: true });
}

function listPostFiles(): string[] {
  ensurePostsDir();
  return fs.readdirSync(POSTS_PATH).filter((f) => /\.(md|mdx)$/i.test(f));
}

function toArrayTags(tags: unknown): string[] | undefined {
  if (!tags) return undefined;
  if (Array.isArray(tags)) return tags.map(String);
  if (typeof tags === "string")
    return tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return undefined;
}

function pickFirstExisting(...candidates: string[]): string | null {
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return null;
}

function firstString(...cands: unknown[]): string | undefined {
  for (const v of cands) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return undefined;
}

/* -------------------- core API -------------------- */

export function getAllPosts(): PostSummary[] {
  const files = listPostFiles();
  const items: PostSummary[] = files.map((file) => {
    const full = path.join(POSTS_PATH, file);
    const raw = fs.readFileSync(full, "utf8");
    const { data, content } = matter(raw);
    const slug = file.replace(/\.mdx?$/i, "");
    const title = (data.title as string) ?? slug;
    const description = (data.description as string) ?? (data.excerpt as string) ?? "";
    const date = (data.date as string) ?? "";
    const tags = toArrayTags((data as any).tags);

    // Try several common keys for hero/cover images
    const heroUrl = firstString(
      (data as any).heroUrl,
      (data as any).hero,
      (data as any).image,
      (data as any).cover,
      (data as any).thumbnail,
      (data as any).banner
    );

    return {
      slug,
      title,
      description,
      date,
      readingTime: readingTimeLite(content),
      tags,
      heroUrl,
    };
  });

  return items.sort((a, b) => {
    const da = a.date ? Date.parse(a.date) : 0;
    const db = b.date ? Date.parse(b.date) : 0;
    return db - da;
  });
}

export function getPostBySlug(slug: string): Post {
  const md = path.join(POSTS_PATH, `${slug}.md`);
  const mdx = path.join(POSTS_PATH, `${slug}.mdx`);
  const full = pickFirstExisting(mdx, md);
  if (!full) {
    // Fail loudly in dev.
    throw new Error(`Post not found: ${slug}`);
  }
  const raw = fs.readFileSync(full, "utf8");
  const { data, content } = matter(raw);

  const title = (data.title as string) ?? slug;
  const description = (data.description as string) ?? (data.excerpt as string) ?? "";
  const date = (data.date as string) ?? "";
  const tags = toArrayTags((data as any).tags);
  const topic = (data as any).topic as string | undefined;

  const topicSlug =
    topic
      ?.toLowerCase()
      .replace(/&/g, "and")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") ?? undefined;

  // Normalize hero fields from multiple possible front-matter keys
  const heroUrl = firstString(
    (data as any).heroUrl,
    (data as any).hero,
    (data as any).image,
    (data as any).cover,
    (data as any).thumbnail,
    (data as any).banner
  );
  const heroCaption = firstString(
    (data as any).heroCaption,
    (data as any).imageCaption,
    (data as any).caption
  );
  const heroAlt = firstString((data as any).heroAlt, (data as any).imageAlt, (data as any).alt);

  return {
    slug,
    content,
    meta: {
      title,
      description,
      date,
      readingTime: readingTimeLite(content),
      tags,
      topic,
      topicSlug,
      heroUrl,
      heroCaption,
      heroAlt,
    },
  };
}
