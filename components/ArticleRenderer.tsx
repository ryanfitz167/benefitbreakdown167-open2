// app/components/ArticleRenderer.tsx

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Image from "next/image";
import readingTime from "reading-time";
import { incrementViewCount, getViewCount } from "@/lib/viewCounter";

export async function ArticleRenderer({
  category,
  subcategory,
  slug,
}: {
  category: string;
  subcategory: string;
  slug: string;
}) {
  const filePath = path.join(
    process.cwd(),
    "public",
    "articles",
    category,
    subcategory,
    `${slug}.mdx`
  );

  let fileContent;
  try {
    fileContent = await fs.readFile(filePath, "utf8");
  } catch {
    notFound();
  }

  const { content, data: frontmatter } = matter(fileContent);
  const stats = readingTime(content);

  // Image support
  const imagePath = path.join(
    "/articles",
    category,
    subcategory,
    `${slug}.png`
  );
  const imageExists = await fs
    .access(path.join("public", imagePath))
    .then(() => true)
    .catch(() => false);

  // Track views
  await incrementViewCount(`${category}/${subcategory}/${slug}`);
  const views = await getViewCount(`${category}/${subcategory}/${slug}`);

  return (
    <article className="prose lg:prose-lg mx-auto py-8 px-4">
      <h1 className="mb-2 text-4xl font-bold">
        {frontmatter?.title ?? slug.replace(/-/g, " ")}
      </h1>
      <p className="text-sm text-slate-500 mb-4">
        🗓️ {frontmatter?.date ?? "Unknown date"} &middot; ⏱️ {stats.text} &middot;
        👁️ {views} views
      </p>

      {imageExists && (
        <Image
          src={imagePath}
          alt={frontmatter?.title ?? "Article image"}
          width={800}
          height={400}
          className="rounded-xl mb-6"
        />
      )}

      <MDXRemote source={content} />
    </article>
  );
}
