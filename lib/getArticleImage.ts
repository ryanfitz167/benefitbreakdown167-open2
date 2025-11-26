import fs from "fs";
import path from "path";

const supportedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

export function findImageForArticle(section: string, slug: string): string | null {
  const basePath = path.join(process.cwd(), "public", "articles", section);
  for (const ext of supportedExtensions) {
    const imagePath = path.join(basePath, `${slug}${ext}`);
    if (fs.existsSync(imagePath)) {
      return `/articles/${section}/${slug}${ext}`;
    }
  }
  return null;
}
