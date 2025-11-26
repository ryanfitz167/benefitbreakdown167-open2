// actions/generateArticle.ts
"use server";

import fs from "fs/promises";
import path from "path";
import slugify from "slugify";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type DraftResult = {
  mdx: string;                 // frontmatter + H1 + body + "## References"
  suggestedImageUrl?: string;
};

type PublishResult = {
  slug: string;
  articlePath: string;         // /category/... route
  imagePath?: string;          // /articles/... public path
};

type ValidationResult = {
  hasReferencesSection: boolean;
  missingFromReferences: Array<{ author: string; year: string }>;
  uncitedReferences: Array<{ raw: string }>;
  fixed?: string;
};

// --- helper: insert image under first H1 ---
function insertImageUnderTitle(mdx: string, publicImagePath: string, alt: string) {
  const lines = mdx.split("\n");
  let i = 0;
  while (i < lines.length && !lines[i].startsWith("# ")) i++;

  if (i < lines.length) {
    const nextLine = lines[i + 1] ?? "";
    const alreadyHasImage = nextLine.trim().startsWith("![") || nextLine.trim().startsWith("<img");
    if (!alreadyHasImage) {
      const imgBlock = `\n![${alt}](${publicImagePath})\n`;
      lines.splice(i + 1, 0, imgBlock);
      return lines.join("\n");
    }
  }

  // fallback: after frontmatter if present
  if (mdx.startsWith("---")) {
    const fmEnd = mdx.indexOf("\n---", 3);
    if (fmEnd !== -1) {
      const head = mdx.slice(0, fmEnd + 4);
      const body = mdx.slice(fmEnd + 4);
      return `${head}\n\n![${alt}](${publicImagePath})\n${body}`;
    }
  }
  return `![${alt}](${publicImagePath})\n\n${mdx}`;
}

// --- tiny parser utilities ---
function findReferencesBlock(mdx: string) {
  const refHeader = /(^|\n)##\s*References\s*$/im;
  const match = mdx.match(refHeader);
  if (!match) return { has: false, start: -1, content: "" };

  const start = match.index! + match[0].length;
  const content = mdx.slice(start).trim();
  return { has: true, start, content };
}

const CITE_RE = /\(([^)]+?),\s*(\d{4}[a-z]?)\)/g;
const APA_HEAD_RE = /^\s*([^.(]+?)\s*\((\d{4}[a-z]?)\)\./;

function normalizeAuthor(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function generateDraft(
  category: string,
  subcategory: string,
  title: string,
  description: string,
  sourceUrls: string[] = []
): Promise<DraftResult> {
  const haveSources = sourceUrls.length > 0;

  const sourcesBlock = haveSources
    ? [
        `Use ONLY the following sources for factual claims (paraphrase; no quotes unless necessary).`,
        ...sourceUrls.map((u, i) => `${i + 1}. ${u}`),
        ``,
        `For each fact you take from a source, include an in-text citation in (Author/Org, Year) format.`,
        `At the end, include full APA entries for only the sources you actually cited, with URL.`,
      ].join("\n")
    : [
        `If no sources are provided, use your trained knowledge but still include (Author/Org, Year) in-text citations and an APA "## References" section using reputable sources.`,
        `Avoid hallucinations: prefer federal/official guidance (IRS, DOL, HHS, CMS), statutes, or respected outlets.`,
      ].join("\n");

  const prompt = [
    `Write a professional MDX blog article for HR/benefits leaders on: "${title}".`,
    `Audience: HR leaders, CFOs, benefits admins.`,
    `Tone: clear, human, practical. Include a short disclaimer (not legal/medical advice).`,
    `Length: ~1200–2000 words (3–5 minute read).`,
    `Formatting:`,
    `- Frontmatter: title, description, date (ISO), category, subcategory, readingTime: "3–5 min".`,
    `- Start with a single H1 matching the title.`,
    `- Use H2/H3, bold key terms, bullets where helpful.`,
    `- Include a concise "Takeaways" section.`,
    ``,
    `Citations & References:`,
    `- Use in-text citations for facts: (Author/Org, Year).`,
    `- End with "## References" and APA entries for only the sources actually cited.`,
    `- APA entry: Author/Org. (Year). Title. Publisher/Source. URL`,
    ``,
    sourcesBlock,
    `IMPORTANT: Produce valid MDX only. No code fences.`,
  ].join("\n");

  const chat = await openai.chat.completions.create({
    model: "gpt-4",
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }],
  });

  const fallback =
    `---\ntitle: ${title}\ndescription: ${description}\n` +
    `date: ${new Date().toISOString()}\ncategory: ${category}\nsubcategory: ${subcategory}\nreadingTime: "3–5 min"\n---\n\n` +
    `# ${title}\n\n(Generation error.)\n\n## References\n`;

  const mdx = chat.choices?.[0]?.message?.content?.trim() || fallback;

  // Optional header image suggestion (AI)
  const img = await openai.images.generate({
    model: "dall-e-3",
    prompt: `Clean, editorial blog header image for: ${title}. Healthcare/employee benefits context. Minimal, modern.`,
    size: "1024x1024",
    n: 1,
  });

  const suggestedImageUrl = img.data?.[0]?.url;
  return { mdx, suggestedImageUrl };
}

export async function validateReferences(mdx: string): Promise<ValidationResult> {
  const citations = new Set<string>();
  const citedPairs: Array<{ author: string; year: string }> = [];

  let m: RegExpExecArray | null;
  while ((m = CITE_RE.exec(mdx)) !== null) {
    const author = normalizeAuthor(m[1] || "");
    const year = (m[2] || "").toLowerCase();
    if (author && year) {
      citations.add(`${author}|${year}`);
      citedPairs.push({ author: m[1].trim(), year: m[2] });
    }
  }

  const { has, content } = findReferencesBlock(mdx);
  let hasReferencesSection = has;
  let refsRaw: string[] = [];

  if (has) {
    refsRaw = content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("##"));
  }

  const references = new Set<string>();
  const allRefHeads: Array<{ raw: string; key?: string }> = [];

  for (const line of refsRaw) {
    const m = line.match(APA_HEAD_RE);
    if (m) {
      const author = normalizeAuthor(m[1]);
      const year = m[2].toLowerCase();
      const key = `${author}|${year}`;
      references.add(key);
      allRefHeads.push({ raw: line, key });
    } else {
      allRefHeads.push({ raw: line });
    }
  }

  const missingFromReferences: Array<{ author: string; year: string }> = [];
  for (const { author, year } of citedPairs) {
    const key = `${normalizeAuthor(author)}|${year.toLowerCase()}`;
    if (!references.has(key)) {
      missingFromReferences.push({ author, year });
    }
  }

  const uncitedReferences: Array<{ raw: string }> = [];
  for (const r of allRefHeads) {
    if (r.key && !citations.has(r.key)) {
      uncitedReferences.push({ raw: r.raw });
    }
  }

  let fixed: string | undefined;
  if (!hasReferencesSection) {
    const needsNewline = mdx.endsWith("\n") ? "" : "\n";
    fixed = `${mdx}${needsNewline}\n## References\n`;
    hasReferencesSection = true;
  }

  return {
    hasReferencesSection,
    missingFromReferences,
    uncitedReferences,
    fixed,
  };
}

// ✅ SLUG-SAFE PUBLISHING (category/subtopic dashed, optional subtopic)
// actions/generateArticle.ts — replace ONLY publishArticle with this version


// Find an existing directory under `root` whose slugified name matches `wantSlug`.
// If found, return the actual folder name (preserves your casing/punctuation).
async function resolveExistingDir(root: string, wantSlug: string): Promise<string | undefined> {
  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const fsSlug = slugify(e.name, { lower: true, strict: true });
      if (fsSlug === wantSlug) return e.name; // exact folder to use
    }
  } catch {}
  return undefined;
}

function titleCaseFromSlug(slug: string) {
  if (!slug) return "";
  const special = new Set(["ACA", "HIPAA", "HSA", "HRA", "FSA", "PCORI", "ERISA", "COBRA", "CMS", "HMO", "PPO", "EPO", "HDHP", "OOP"]);
  return slug
    .split("-")
    .map((w) => {
      const up = w.toUpperCase();
      if (special.has(up)) return up;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join("-");
}

export async function publishArticle(
  category: string,
  subcategory: string | undefined,
  title: string,
  mdxContent: string,
  imageUrl?: string,
  uploadedImageBuffer?: Buffer,
  uploadedImageName?: string
) {
  const catSlug = slugify((category || "").trim(), { lower: true, strict: true });
  const subSlug = subcategory ? slugify(subcategory.trim(), { lower: true, strict: true }) : "";

  const articlesRoot = path.join(process.cwd(), "public", "articles");

  // Resolve the actual Category folder name (e.g., "In-the-News")
  const fsCategory =
    (await resolveExistingDir(articlesRoot, catSlug)) || titleCaseFromSlug(catSlug) || "Uncategorized";

  let baseDir = path.join(articlesRoot, fsCategory);

  // Resolve Subtopic folder (e.g., "Courts-&-Regs") if provided
  let fsSubtopic: string | undefined;
  if (subSlug) {
    fsSubtopic =
      (await resolveExistingDir(baseDir, subSlug)) || titleCaseFromSlug(subSlug);
    baseDir = path.join(baseDir, fsSubtopic);
  }

  await fs.mkdir(baseDir, { recursive: true });

  const slug = slugify(title, { lower: true, strict: true });

  // Save image (uploaded takes priority)
  let imagePublicPath: string | undefined;
  if (uploadedImageBuffer && uploadedImageName) {
    const base = uploadedImageName.replace(/[^\w.\-]/g, "_");
    await fs.writeFile(path.join(baseDir, base), uploadedImageBuffer);
    imagePublicPath = fsSubtopic
      ? `/articles/${fsCategory}/${fsSubtopic}/${base}`
      : `/articles/${fsCategory}/${base}`;
  } else if (imageUrl) {
    try {
      const res = await fetch(imageUrl);
      const buffer = Buffer.from(await res.arrayBuffer());
      const imageFs = path.join(baseDir, `${slug}.png`);
      await fs.writeFile(imageFs, buffer);
      imagePublicPath = fsSubtopic
        ? `/articles/${fsCategory}/${fsSubtopic}/${slug}.png`
        : `/articles/${fsCategory}/${slug}.png`;
    } catch {
      // ignore image failure
    }
  }

  // Inject hero under title if present
  let finalMDX = mdxContent;
  if (imagePublicPath) {
    // reuse your existing insertImageUnderTitle helper
    // @ts-ignore
    finalMDX = insertImageUnderTitle(finalMDX, imagePublicPath, title);
  }

  // Save MDX
  const mdxPathFs = path.join(baseDir, `${slug}.mdx`);
  await fs.writeFile(mdxPathFs, finalMDX, "utf8");

  // Route path uses slugs (not folder names)
  const routePath = subSlug
    ? `/category/${catSlug}/${subSlug}/${slug}`
    : `/category/${catSlug}/${slug}`;

  return {
    slug,
    articlePath: routePath,
    imagePath: imagePublicPath,
  };
}
