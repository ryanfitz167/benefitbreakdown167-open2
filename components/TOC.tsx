"use client";
import { useEffect, useState } from "react";

type Item = { id: string; text: string; level: number };

export default function TOC() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const root = document.getElementById("article-content");
    if (!root) return;
    const hs = Array.from(root.querySelectorAll<HTMLHeadingElement>("h2, h3"));
    const list: Item[] = hs.map(h => {
      const text = h.textContent?.trim() ?? "";
      let id = h.id || text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      if (!h.id) h.id = id;
      return { id, text, level: h.tagName === "H2" ? 2 : 3 };
    });
    setItems(list);
  }, []);

  if (!items.length) return null;

  return (
    <nav className="sticky top-24">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">On this page</div>
      <ul className="space-y-2 text-sm">
        {items.map(it => (
          <li key={it.id} className={it.level === 3 ? "pl-3" : ""}>
            <a href={`#${it.id}`} className="hover:underline text-neutral-700">{it.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
