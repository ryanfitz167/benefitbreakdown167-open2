import Link from "next/link";

export type PostListItem = {
  slug: string;
  title: string;
  date?: string | null;
  excerpt?: string | null;
  metaRight?: string | null; // e.g., "5 min read" or "1.2k views"
};

export default function PostList({ items, compact = false }: { items: PostListItem[]; compact?: boolean }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {items.map((p) => (
        <li key={p.slug} style={{ padding: compact ? "8px 0" : "12px 0", borderBottom: "1px solid #eee" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <Link href={`/blog/${p.slug}`} style={{ textDecoration: "none" }}>
                <h3 style={{ margin: 0, fontSize: compact ? 15 : 17, lineHeight: 1.35 }}>{p.title}</h3>
              </Link>
              {p.date && (
                <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                  {new Date(p.date).toLocaleDateString()}
                </div>
              )}
              {p.excerpt && !compact && (
                <p style={{ color: "#444", fontSize: 14, marginTop: 6, marginBottom: 0 }}>{p.excerpt}</p>
              )}
            </div>
            {p.metaRight && <div style={{ color: "#666", fontSize: 12, whiteSpace: "nowrap" }}>{p.metaRight}</div>}
          </div>
        </li>
      ))}
    </ul>
  );
}
