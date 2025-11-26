// lib/sections.ts
export const VALID_SECTIONS = [
  "articles",
  "trending",
  "definitions",
  "compliance",
  "in-the-news",
  "future",
] as const;

export type Section = typeof VALID_SECTIONS[number];

export const SECTION_LABELS: Record<Section, string> = {
  articles: "All Articles",
  trending: "Trending",
  definitions: "Definitions",
  compliance: "Compliance",
  "in-the-news": "In the News",
  future: "Future",
};
