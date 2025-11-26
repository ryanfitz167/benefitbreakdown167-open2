// actions/uploadArticle.ts
"use server";
import fs from "fs/promises";
import path from "path";

export async function uploadArticle(section: string, article: string, imageFile?: File) {
  const dir = path.join(process.cwd(), "public", "articles", section);
  await fs.mkdir(dir, { recursive: true });

  const articlePathFs = path.join(dir, "article.mdx");
  await fs.writeFile(articlePathFs, article, "utf8");

  let imagePath: string | undefined;
  if (imageFile) {
    const buf = new Uint8Array(await imageFile.arrayBuffer());
    const safe = imageFile.name.replace(/[^\w.\-]/g, "_");
    await fs.writeFile(path.join(dir, safe), buf);
    imagePath = `/articles/${section}/${safe}`;
  }

  return { articlePath: `/articles/${section}/article.mdx`, imagePath };
}
