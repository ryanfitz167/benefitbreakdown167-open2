// FILE: lib/topics.ts
export type TopicSlug =
  | "trending"
  | "in-the-news"
  | "compliance"
  | "definitions"
  | "future"
  | "flyers-and-guides"
  | "medicare-medicaid"
  | "cost";

export const TOPICS: Array<{ slug: TopicSlug; title: string }> = [
  { slug: "trending", title: "Trending" },
  { slug: "in-the-news", title: "In the News" },
  { slug: "compliance", title: "Compliance" },
  { slug: "definitions", title: "Definitions" },
  { slug: "future", title: "Future" },
  { slug: "flyers-and-guides", title: "Flyers & Guides" },
  // NEW
  { slug: "medicare-medicaid", title: "Medicare/Medicaid" },
  { slug: "cost", title: "Cost" },
];

export const TOPIC_LABELS: Record<TopicSlug, string> = TOPICS.reduce((acc, t) => {
  acc[t.slug] = t.title;
  return acc;
}, {} as Record<TopicSlug, string>);

/** Normalize any label/slug-ish string to our canonical slug form. */
function normalizeToSlug(input: string): TopicSlug | string {
  // allow "/" to map to "-" so "Medicare/Medicaid" ⇢ "medicare-medicaid"
  const n = input
    .toLowerCase()
    .replace(/[&]+/g, "and")
    .replace(/[\/]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return n;
}

export function slugToTitle(slug: TopicSlug): string {
  return TOPIC_LABELS[slug] ?? slug;
}

export function labelToTopicSlug(label: string): TopicSlug | null {
  const n = normalizeToSlug(label) as TopicSlug;
  return (TOPICS as any).some((t: any) => t.slug === n) ? n : null;
}
// Map any human label or slug-ish string to a canonical TopicSlug.
// Falls back to "in-the-news" if it doesn't match.
export function toTopicSlug(labelOrSlug: string): TopicSlug {
  return labelToTopicSlug(labelOrSlug) ?? "in-the-news";
}

/** Safely get a human title from a TopicSlug (or any string). */
export function humanizeTopic(slug: string): string {
  const n = normalizeToSlug(slug) as TopicSlug;
  return TOPIC_LABELS[n] ?? slug;
}

/** Optional: blurbs for homepage cards */
export const TOPIC_BLURBS: Partial<Record<TopicSlug, string>> = {
  "trending": "Most viewed articles",
  "in-the-news": "Benefits in current headlines",
  "compliance": "Rules, deadlines, notices",
  "definitions": "Jargon, explained simply",
  "future": "What’s changing next",
  "flyers-and-guides": "Downloadables & walkthroughs",
  "medicare-medicaid": "Eligibility, enrollment, coordination",
  "cost": "Premiums, deductibles, and savings levers",
};