// FILE: lib/posts.ts
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time"; // requires types/reading-time.d.ts shim

/** Absolute path to your MDX posts directory. */
export const POSTS_PATH = path.join(process.cwd(), "content", "posts");

/** Frontmatter contract for posts. */
export type PostFrontmatter = {
  title: string;
  date: string;           // ISO string
  description?: string;
  tags?: string[];
  hero?: string;
  draft?: boolean;
};

/** Full post (content included). */
export type Post = {
  slug: string;
  meta: PostFrontmatter & {
    readingTime: string;  // e.g., "4 min read"
    readingMinutes: number;
    words: number;
  };
  content: string;
};

/** Summary (for lists/cards). */
export type PostSummary = {
  slug: string;
  title: string;
  date: string;
  description: string;
  readingTime: string;
  tags: string[];
  hero?: string;
};

/** Strip `.mdx` from a filename. */
function normalizeSlug(s: string): string {
  return s.replace(/\.mdx$/i, "");
}

/** List `.mdx` files, return slugs without extension. */
export function getPostSlugs(): string[] {
  if (!fs.existsSync(POSTS_PATH)) return [];
  return fs
    .readdirSync(POSTS_PATH, { withFileTypes: true })
    .filter((d) => d.isFile() && /\.mdx$/i.test(d.name))
    .map((d) => normalizeSlug(d.name));
}

/** Read raw file contents for a given slug (with or without `.mdx`). */
function readFileForSlug(slug: string): string {
  const realSlug = normalizeSlug(slug);
  const fullPath = path.join(POSTS_PATH, `${realSlug}.mdx`);
  if (!fs.existsSync(fullPath)) {
    // Why: surface missing files early during dev/CI.
    throw new Error(`Post not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, "utf8");
}

/** Parse MDX frontmatter + content. */
function parseFrontmatter(file: string): { data: Partial<PostFrontmatter>; content: string } {
  const { data, content } = matter(file);
  return { data: data as Partial<PostFrontmatter>, content };
}

/** Compute reading stats once. */
function computeReading(content: string) {
  const stats = readingTime(content, { wordsPerMinute: 200 });
  return {
    text: stats.text,
    minutes: stats.minutes,
    words: stats.words,
  };
}

/** Load a single post by slug. */
export function getPostBySlug(slug: string): Post {
  const realSlug = normalizeSlug(slug);
  const file = readFileForSlug(realSlug);
  const { data, content } = parseFrontmatter(file);
  if (data?.draft) {
    // Why: keep draft posts out of production render by default.
    throw new Error(`Post is marked as draft: ${realSlug}`);
  }

  // Fallbacks when frontmatter is incomplete
  const title = data?.title ?? realSlug.replace(/-/g, " ");
  const date =
    data?.date ??
    new Date(
      fs.statSync(path.join(POSTS_PATH, `${realSlug}.mdx`)).mtimeMs
    ).toISOString();

  const rt = computeReading(content);

  return {
    slug: realSlug,
    meta: {
      title,
      date,
      description: data?.description ?? "",
      tags: Array.isArray(data?.tags) ? (data!.tags as string[]) : [],
      hero: data?.hero,
      readingTime: rt.text,
      readingMinutes: rt.minutes,
      words: rt.words,
    },
    content,
  };
}

/** Load all posts and return concise summaries, newest first. */
export function getAllPosts(): PostSummary[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((s) => {
      const p = getPostBySlug(s);
      return {
        slug: p.slug,
        title: p.meta.title,
        date: p.meta.date,
        description: p.meta.description ?? "",
        readingTime: p.meta.readingTime,
        tags: p.meta.tags ?? [],
        hero: p.meta.hero,
      } as PostSummary;
    })
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return posts;
}

/** Filter posts by tag (case-insensitive). */
export function getPostsByTag(tag: string): PostSummary[] {
  const needle = tag.trim().toLowerCase();
  return getAllPosts().filter((p) => p.tags.some((t) => t.toLowerCase() === needle));
}

/** Collect a unique, sorted tag list. */
export function getAllTags(): string[] {
  const set = new Set<string>();
  for (const p of getAllPosts()) for (const t of p.tags) set.add(t);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

