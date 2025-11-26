// lib/viewCounter.ts

const store: Record<string, number> = {};

export async function incrementViewCount(slug: string): Promise<void> {
  store[slug] = (store[slug] ?? 0) + 1;
}

export async function getViewCount(slug: string): Promise<number> {
  return store[slug] ?? 0;
}

