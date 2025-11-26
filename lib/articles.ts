// lib/articles.ts
import { promises as fs } from "fs";
import path from "path";

/**
 * Filesystem-backed articles.
 * Layout (supported roots):
 *   - /public/articles/<category>/<subtopic>/<slug>.mdx  (with subtopic)
 *   - /public/articles/<category>/<slug>.mdx             (no subtopic)
 *   - /content/<category>/<subtopic>/<slug>.mdx
 *   - /content/<category>/<slug>.mdx
 */

export type Article = {
  id: string;
  title: string;

  /** Route slugs (derived from folders) */
  category: string;
  subtopic: string;  // "" when no subtopic
  slug: string;

  /** HTML body ready for dangerouslySetInnerHTML */
  contentHtml: string;

  published: boolean;
  publishedAt: string;

  /** Optional display label/badge from front-matter */
  displayCategory?: string;

  heroImageUrl?: string;
  heroImageAlt?: string;
  sources?: { url: string; label?: string }[];

  /** Optional description/summary if present in front matter */
  description?: string;
  summary?: string;
};

const ROOTS = [
  path.join(process.cwd(), "public", "articles"),
  path.join(process.cwd(), "content"),
];

/* --------------------------- helpers --------------------------- */

const CATEGORY_ALIASES: Record<string, string> = {
  "news": "news",
  "in the news": "news",
  "compliance": "compliance",
  "definitions": "definitions",
  "plans": "plans",
  "medicare": "medicare",
  "playbook": "playbook",
};
function canonicalCategory(input: string) {
  const s = String(input || "").trim().toLowerCase();
  return CATEGORY_ALIASES[s] || s.replace(/\s+/g, "-");
}

function parseFrontmatter(text: string): { data: any; body: string } {
  if (!text.startsWith("---")) return { data: {}, body: text };
  const end = text.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: text };
  const front = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\s+/, "");
  const data: any = {};
  for (const line of front.split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val: any = m[2].trim();
    // strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // arrays like [a, b, c]
    if (val.startsWith("[") && val.endsWith("]")) {
      val = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
    }
    data[key] = val;
  }
  return { data, body };
}

/** Very small Markdown→HTML converter (headings, links, lists, paragraphs) */
function simpleMarkdownToHtml(markdown: string): string {
  const rawLines = markdown.replace(/\r\n/g, "\n").split("\n");

  // Drop a leading H1; page header renders title as H1.
  let i = 0;
  while (i < rawLines.length && rawLines[i].trim() === "") i++;
  if (i < rawLines.length && rawLines[i].trim().startsWith("# ")) {
    rawLines.splice(i, 1);
  }

  const lines = rawLines;

  const out: string[] = [];
  let listOpen = false;
  let pbuf: string[] = [];

  const flushList = () => {
    if (listOpen) {
      out.push("</ul>");
      listOpen = false;
    }
  };
  const flushP = () => {
    const t = pbuf.join(" ").trim();
    pbuf = [];
    if (!t) return;
    out.push(`<p>${inline(t)}</p>`);
  };
  const inline = (s: string) =>
    s
      // links: [text](url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, a, b) => `<a href="${b}" target="_blank" rel="noopener noreferrer">${a}</a>`)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");

  for (const line of lines) {
    const t = line.trimRight();

    // headings
    const hm = t.match(/^(#{1,3})\s+(.+)$/);
    if (hm) {
      flushP();
      flushList();
      const level = hm[1].length;
      out.push(`<h${level}>${inline(hm[2])}</h${level}>`);
      continue;
    }

    // list item
    if (/^\s*[-*]\s+/.test(t)) {
      flushP();
      if (!listOpen) {
        out.push("<ul>");
        listOpen = true;
      }
      out.push(`<li>${inline(t.replace(/^\s*[-*]\s+/, ""))}</li>`);
      continue;
    }

    // blank line => paragraph boundary
    if (t.trim() === "") {
      flushP();
      flushList();
      continue;
    }

    pbuf.push(t);
  }
  flushP();
  flushList();

  return out.join("\n");
}

async function walkArticles(): Promise<Array<{ file: string; category: string; subtopic: string; slug: string }>> {
  const results: Array<{ file: string; category: string; subtopic: string; slug: string }> = [];

  async function safeReaddir(p: string) {
    try {
      return await fs.readdir(p, { withFileTypes: true });
    } catch {
      return [];
    }
  }

  for (const ROOT of ROOTS) {
    const catDirs = await safeReaddir(ROOT);
    for (const cat of catDirs) {
      if (!cat.isDirectory()) continue;
      const category = canonicalCategory(cat.name);

      // Top-level: /<category>/<slug>.mdx
      const topFiles = await safeReaddir(path.join(ROOT, cat.name));
      for (const f of topFiles) {
        if (!f.isFile()) continue;
        if (!f.name.toLowerCase().endsWith(".mdx")) continue;
        const slug = f.name.replace(/\.mdx$/i, "");
        results.push({
          file: path.join(ROOT, cat.name, f.name),
          category,
          subtopic: "",
          slug,
        });
      }

      // Nested: /<category>/<subtopic>/<slug>.mdx
      const subDirs = await safeReaddir(path.join(ROOT, cat.name));
      for (const sub of subDirs) {
        if (!sub.isDirectory()) continue;
        const subtopic = sub.name;
        const files = await safeReaddir(path.join(ROOT, cat.name, sub.name));
        for (const f of files) {
          if (!f.isFile()) continue;
          if (!f.name.toLowerCase().endsWith(".mdx")) continue;
          const slug = f.name.replace(/\.mdx$/i, "");
          results.push({
            file: path.join(ROOT, cat.name, sub.name, f.name),
            category,
            subtopic,
            slug,
          });
        }
      }
    }
  }
  return results;
}

async function loadArticleFromFile(rec: { file: string; category: string; subtopic: string; slug: string }): Promise<Article | null> {
  try {
    const text = await fs.readFile(rec.file, "utf8");
    const { data, body } = parseFrontmatter(text);

    const title = String(data.title || rec.slug.replace(/-/g, " ").replace(/\b\w/g, (m: string) => m.toUpperCase()));
    const category = canonicalCategory(data.category || rec.category);
    const subtopic = String(data.subtopic || rec.subtopic || "");
    const slug = rec.slug;

    const published = data.published === undefined ? true : Boolean(data.published);
    const publishedAt = String(data.publishedAt || data.date || new Date().toISOString());

    const displayCategory =
      (data.category && String(data.category)) || titleCase(category);

    const contentHtml = simpleMarkdownToHtml(body);

    const heroImageUrl = data.heroImageUrl ? String(data.heroImageUrl) : undefined;
    const heroImageAlt = data.heroImageAlt ? String(data.heroImageAlt) : undefined;
    const sources = Array.isArray(data.sources)
      ? data.sources.map((s: any) => s && s.url ? { url: String(s.url), label: s.label ? String(s.label) : undefined } : null).filter(Boolean) as {url:string;label?:string}[]
      : undefined;

    const description = data.description ? String(data.description) : undefined;
    const summary = data.summary ? String(data.summary) : undefined;

    return {
      id: `${category}/${subtopic ? subtopic + "/" : ""}${slug}`,
      title,
      category,
      subtopic,
      slug,
      contentHtml,
      published,
      publishedAt,
      displayCategory,
      heroImageUrl,
      heroImageAlt,
      sources,
      description,
      summary,
    };
  } catch (e) {
    console.error("[articles] Failed reading", rec.file, e);
    return null;
  }
}

async function readAll(): Promise<Article[]> {
  const files = await walkArticles();
  const items: Article[] = [];
  for (const rec of files) {
    const art = await loadArticleFromFile(rec);
    if (art && art.published) items.push(art);
  }
  items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return items;
}

/* --------------------------- public API --------------------------- */

export async function getAllArticles() {
  return await readAll();
}

export async function getArticlesByCategory(category: string) {
  const all = await readAll();
  const c = canonicalCategory(category || "");
  return all.filter((a) => a.category === c);
}

export async function getArticlesBySubtopic(category: string, subtopic: string) {
  const all = await readAll();
  const c = canonicalCategory(category || "");
  const s = (subtopic || "").toLowerCase();
  return all.filter((a) => a.category === c && a.subtopic.toLowerCase() === s);
}

export async function getArticle({
  category,
  subtopic,
  slug,
}: {
  category: string;
  subtopic: string;
  slug: string;
}) {
  const all = await readAll();
  const c = canonicalCategory(category || "");
  const s = (subtopic || "").toLowerCase();
  const u = decodeURIComponent(slug || "");
  return all.find((a) => a.category === c && a.subtopic.toLowerCase() === s && a.slug === u);
}

/** ✅ Two-segment article (no subtopic): /category/<category>/<slug> */
export async function getArticleInCategory({
  category,
  slug,
}: {
  category: string;
  slug: string;
}) {
  const all = await readAll();
  const c = canonicalCategory(category || "");
  const u = decodeURIComponent(slug || "");
  return all.find((a) => a.category === c && !a.subtopic && a.slug === u);
}

/** List subtopics for a category (to prebuild menus) */
export async function getSubtopicsByCategory(category: string) {
  const all = await readAll();
  const c = canonicalCategory(category || "");
  const subs = new Set<string>();
  for (const a of all) if (a.category === c && a.subtopic) subs.add(a.subtopic);
  return Array.from(subs).sort();
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

