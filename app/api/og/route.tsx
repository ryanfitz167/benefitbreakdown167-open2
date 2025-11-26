// FILE: app/og/route.ts
import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/posts";

export const runtime = "edge";
export const alt = "Benefit Breakdown";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BRAND = {
  bg: "#ffffff",
  ink: "#111111",
  fog: "#6b7280",
  accent: "#111111"
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  // Defaults
  let title = "Benefit Breakdown";
  let description = "Clear, concise health insurance insights.";
  let tagText = "";

  if (slug) {
    try {
      const post = getPostBySlug(slug);
      title = post.meta.title || title;
      description = (post.meta.description || description).slice(0, 180);
      const tags = Array.isArray(post.meta.tags) ? post.meta.tags : [];
      tagText = tags.slice(0, 3).join(" • ");
    } catch {
      // slug not found → keep defaults
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: BRAND.bg,
          color: BRAND.ink,
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
          padding: 48,
          boxSizing: "border-box",
          justifyContent: "space-between",
          flexDirection: "column"
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: BRAND.accent
            }}
          />
          <div style={{ fontSize: 32, fontWeight: 700 }}>Benefit Breakdown</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 64, lineHeight: 1.1, fontWeight: 700 }}>{title}</div>
          {description && (
            <div style={{ fontSize: 28, color: BRAND.fog }}>{description}</div>
          )}
          {tagText && (
            <div
              style={{
                marginTop: 8,
                fontSize: 24,
                color: BRAND.fog
              }}
            >
              {tagText}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: BRAND.fog
          }}
        >
          <div>benefitbreakdown.com</div>
          <div>© {new Date().getFullYear()}</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
