// lib/loadSources.ts
import path from "path";
import fs from "fs/promises";

export async function loadSources(): Promise<string[]> {
  const filePath = path.join(process.cwd(), "data", "sources.json");

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const articles = JSON.parse(raw);

    // Extract just the content (or titles and content if needed)
    return articles.map((a: { content: string }) => a.content);
  } catch (err) {
    if (err instanceof Error) {
      console.error("Failed to load sources.json:", err.message);
    } else {
      console.error("Failed to load sources.json:", err);
    }
    return [];
  }
}
