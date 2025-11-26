// FILE: lib/views.ts
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const VIEWS_FILE = path.join(DATA_DIR, "views.json");

type ViewMap = Record<string, number>;

function ensureStore(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
    if (!fs.existsSync(VIEWS_FILE)) fs.writeFileSync(VIEWS_FILE, "{}");
  } catch {
    // Why: allow read-only/serverless to proceed without crashing.
  }
}

function readViews(): ViewMap {
  try {
    ensureStore();
    const raw = fs.readFileSync(VIEWS_FILE, "utf8");
    return JSON.parse(raw || "{}") as ViewMap;
  } catch {
    return {};
  }
}

function writeViews(map: ViewMap): void {
  try {
    ensureStore();
    fs.writeFileSync(VIEWS_FILE, JSON.stringify(map, null, 2), "utf8");
  } catch {
    // ignore write errors
  }
}

export function incrementView(slug: string): number {
  const map = readViews();
  map[slug] = (map[slug] ?? 0) + 1;
  writeViews(map);
  return map[slug];
}

export function getViews(slug: string): number {
  const map = readViews();
  return map[slug] ?? 0;
}

export function getTrendingSlugs(limit = 12): Array<{ slug: string; views: number }> {
  const map = readViews();
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([slug, views]) => ({ slug, views }));
}