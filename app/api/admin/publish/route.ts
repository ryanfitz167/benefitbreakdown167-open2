// FILE: app/api/admin/publish/route.ts
import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { humanizeTopic, type TopicSlug } from "@/lib/topics";

export const runtime = "nodejs";

type Source = { title: string; url: string; publisher?: string; date?: string };
type PublishPayload = {
  title: string;
  dek?: string;
  topicSlug: TopicSlug;     // <<— strong typing
  tags?: string[];
  bodyMarkdown: string;
  sources: Source[];
  imageBase64?: string;
};

function kebab(s: string) {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
function uniqueSlug(baseDir: string, base: string): string {
  let s = base || "post";
  let i = 1;
  while (fs.existsSync(path.join(baseDir, `${s}.mdx`)) || fs.existsSync(path.join(baseDir, `${s}.md`))) {
    s = `${base}-${i++}`;
  }
  return s;
}

export async function POST(req: Request) {
  const POSTS_DIR = path.join(process.cwd(), "content", "posts");
  const PUBLIC_IMG_DIR = path.join(process.cwd(), "public", "images");
  ensureDir(POSTS_DIR);
  ensureDir(PUBLIC_IMG_DIR);

  const { title, dek, topicSlug, tags = [], bodyMarkdown, sources, imageBase64 }: PublishPayload =
    await req.json();

  if (!title || !topicSlug || !bodyMarkdown || !Array.isArray(sources) || sources.length < 2) {
    return NextResponse.json({ error: "Missing required fields or not enough sources" }, { status: 400 });
  }

  const dateISO = new Date().toISOString();
  const slugBase = kebab(title);
  const slug = uniqueSlug(POSTS_DIR, slugBase);

  let coverRel: string | undefined;
  if (imageBase64) {
    try {
      const b = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const buf = Buffer.from(b, "base64");
      const imgPath = path.join(PUBLIC_IMG_DIR, `${slug}.jpg`);
      fs.writeFileSync(imgPath, buf);
      coverRel = `/images/${slug}.jpg`;
    } catch {
      // ignore image write errors
    }
  }

  const topicLabel = humanizeTopic(topicSlug); // <<— no inline map, no any

  const fm = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(dek || "")}`,
    `date: ${JSON.stringify(dateISO)}`,
    `topic: ${JSON.stringify(topicLabel)}`,
    tags.length ? `tags: [${tags.map((t) => JSON.stringify(t)).join(", ")}]` : undefined,
    coverRel ? `cover: ${JSON.stringify(coverRel)}` : undefined,
    "---",
  ]
    .filter(Boolean)
    .join("\n");

  const sourcesMd = sources
    .map((s, i) => {
      const meta: string[] = [];
      if (s.publisher) meta.push(s.publisher);
      if (s.date) meta.push(s.date);
      const suffix = meta.length ? ` — ${meta.join(", ")}` : "";
      return `${i + 1}. [${s.title}](${s.url})${suffix}`;
    })
    .join("\n");

  const body = `# ${title}

${dek ? `> ${dek}\n\n` : ""}${bodyMarkdown.trim()}

## Sources
${sourcesMd}
`;

  fs.writeFileSync(path.join(POSTS_DIR, `${slug}.mdx`), `${fm}\n\n${body}`, "utf8");

  return NextResponse.json({ ok: true, slug, path: `/blog/${slug}`, cover: coverRel || null });
}
