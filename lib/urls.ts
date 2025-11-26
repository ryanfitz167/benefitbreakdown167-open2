// lib/urls.ts
export const categoryPath   = (category: string) =>
  `/category/${encodeURIComponent(category)}`;

export const subtopicPath   = (category: string, subtopic: string) =>
  `/category/${encodeURIComponent(category)}/${encodeURIComponent(subtopic)}`;

export const articlePath    = (category: string, subtopic: string, slug: string) =>
  `/category/${encodeURIComponent(category)}/${encodeURIComponent(subtopic)}/${encodeURIComponent(slug)}`;
