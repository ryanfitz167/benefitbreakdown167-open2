import { ImageResponse } from "next/og";
import { getArticleBySlug } from "@/lib/news"; // title fallback array

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function prettify(slug: string) {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function Image({ params }: { params: { slug: string } }) {
  const a = getArticleBySlug(params.slug);
  const title = a?.title || prettify(params.slug);

  return new ImageResponse(
    (
      <div style={{
        height: "100%", width: "100%", display: "flex", flexDirection: "column",
        justifyContent: "center", padding: 64, background: "white", color: "#0f172a",
        fontFamily: "ui-sans-serif, system-ui",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.2 }}>{title}</div>
        <div style={{ marginTop: 20, fontSize: 28, color: "#334155" }}>Benefit Breakdown · News</div>
      </div>
    ),
    { ...size }
  );
}
