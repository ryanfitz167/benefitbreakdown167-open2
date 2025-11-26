// scripts/fetchAndSaveArticles.ts

import fs from "fs/promises";
import path from "path";
import { extract } from "@extractus/article-extractor";
import fetch from "node-fetch"; // REQUIRED: node-fetch

const URLS_FILE = path.join(process.cwd(), "data", "urls.txt");
const SOURCES_FILE = path.join(process.cwd(), "data", "sources.json");

async function readUrls(): Promise<string[]> {
  try {
    const text = await fs.readFile(URLS_FILE, "utf-8");
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("http"));
  } catch (err) {
    console.error("❌ Failed to read urls.txt", err);
    return [];
  }
}

async function fetchAndExtract(url: string) {
  try {
    const html = await fetch(url).then((res) => res.text());
    const article = await extract(html);
    return article;
  } catch (err) {
    console.error(`❌ Failed to extract content from ${url}`, err);
    return null;
  }
}

async function saveArticles() {
  const urls = await readUrls();
  const articles = [];

  for (const url of urls) {
    const article = await fetchAndExtract(url);
    if (article && article.title && article.content) {
      articles.push({
        title: article.title,
        url,
        content: article.content,
      });
    }
  }

  await fs.writeFile(SOURCES_FILE, JSON.stringify(articles, null, 2));
  console.log(`✅ Saved ${articles.length} articles to sources.json`);
}

saveArticles();
