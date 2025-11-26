import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{
        height: "100%", width: "100%", display: "flex", flexDirection: "column",
        justifyContent: "center", padding: 64, background: "white", color: "#0f172a",
        fontSize: 64, fontWeight: 800, fontFamily: "ui-sans-serif, system-ui",
      }}>
        <div>Benefit Breakdown</div>
        <div style={{ marginTop: 16, fontSize: 28, fontWeight: 500, color: "#334155" }}>
          Health insurance & employee benefits — clear updates
        </div>
      </div>
    ),
    { ...size }
  );
}
