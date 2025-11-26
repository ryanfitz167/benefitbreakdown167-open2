// FILE: lib/content.ts
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

export type ArticleMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  topics: string[];
  draft?: boolean;
};

const CONTENT_DIR = path.join(process.cwd(), "content", "articles");

export async function readAllSlugs(): Promise<string[]> {
  try {
    const files = await fs.readdir(CONTENT_DIR);
    return files.filter((f) => f.endsWith(".mdx")).map((f) => f.replace(/\.mdx$/, ""));
  } catch {
    return [];
  }
}

export async function listArticles({ limit }: { limit?: number } = {}): Promise<ArticleMeta[]> {
  const slugs = await readAllSlugs();
  const metas: ArticleMeta[] = [];
  for (const slug of slugs) {
    const full = await fs.readFile(path.join(CONTENT_DIR, `${slug}.mdx`), "utf8");
    const { data } = matter(full);
    if (data.draft) continue;
    metas.push({
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
      date: data.date ?? new Date().toISOString(),
      topics: (data.topics ?? []).map((t: string) => toTopicSlug(t))
    });
  }
  metas.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return typeof limit === "number" ? metas.slice(0, limit) : metas;
}

export async function getAllTopics(): Promise<string[]> {
  const all = await listArticles();
  return Array.from(new Set(all.flatMap((a) => a.topics)));
}

export function toTopicSlug(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}

export async function getArticlesByTopic(topicSlug: string): Promise<ArticleMeta[]> {
  const all = await listArticles();
  return all.filter((a) => a.topics.includes(toTopicSlug(topicSlug)));
}

export async function getArticleBySlug(slug: string): Promise<(ArticleMeta & { Component: any }) | null> {
  try {
    const full = await fs.readFile(path.join(CONTENT_DIR, `${slug}.mdx`), "utf8");
    const { content, data } = matter(full);
    if (data.draft) return null;

    const { content: MDXContent } = await compileMDX({
      source: content,
      options: {
        parseFrontmatter: false,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          // Why: need slug BEFORE autolink so IDs exist.
          rehypePlugins: [
            rehypeSlug,
            [rehypeAutolinkHeadings, { behavior: "wrap" }]
          ]
        }
      }
    });

    const meta: ArticleMeta = {
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
      date: data.date ?? new Date().toISOString(),
      topics: (data.topics ?? []).map((t: string) => toTopicSlug(t))
    };
    return { ...meta, Component: MDXContent };
  } catch {
    return null;
  }
}
