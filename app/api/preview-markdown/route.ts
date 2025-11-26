// FILE: app/api/preview-markdown/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";

// Minimal HTML escape as a safe fallback
function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const markdown = typeof body?.markdown === "string" ? body.markdown : "";

  // Dynamic-load the remark/rehype stack to avoid TS "cannot find module" errors
  let remark: any,
    remarkGfm: any,
    remarkRehype: any,
    rehypeSlug: any,
    rehypeAutolinkHeadings: any,
    rehypeStringify: any;

  try {
    const [
      remarkMod,
      gfmMod,
      rehypeMdMod,
      slugMod,
      autolinkMod,
      stringifyMod,
    ] = await Promise.all([
      import("remark"), // { remark }
      import("remark-gfm"), // default
      import("remark-rehype"), // default
      import("rehype-slug"), // default
      import("rehype-autolink-headings"), // default
      import("rehype-stringify"), // default
    ]);

    remark = (remarkMod as any).remark;
    remarkGfm = (gfmMod as any).default;
    remarkRehype = (rehypeMdMod as any).default;
    rehypeSlug = (slugMod as any).default;
    rehypeAutolinkHeadings = (autolinkMod as any).default;
    rehypeStringify = (stringifyMod as any).default;
  } catch (e: any) {
    // Common case: package not installed; show actionable hint
    const msg = String(e?.message || e);
    // Try to extract the missing module from the error text
    const missing =
      /Cannot find module '([^']+)'/.exec(msg)?.[1] ||
      /Cannot find package '([^']+)'/.exec(msg)?.[1] ||
      null;

    const installHint = [
      "npm i remark remark-gfm remark-rehype rehype-stringify rehype-slug rehype-autolink-headings",
    ].join("\n");

    return NextResponse.json(
      {
        error: "Markdown preview dependencies missing",
        missing,
        detail: msg,
        fix: installHint,
        // Fallback preview (plaintext) so the UI still shows something
        html: `<pre class="text-sm">${escapeHtml(markdown)}</pre>`,
      },
      { status: 500 },
    );
  }

  try {
    const file = await remark()
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: false })
      .use(rehypeSlug)
      .use(rehypeAutolinkHeadings, { behavior: "wrap" })
      .use(rehypeStringify)
      .process(markdown);

    return NextResponse.json({ html: String(file.value) });
  } catch (e: any) {
    // Last-resort fallback: return escaped plaintext
    return NextResponse.json(
      {
        error: "Failed to render markdown",
        detail: String(e?.message || e),
        html: `<pre class="text-sm">${escapeHtml(markdown)}</pre>`,
      },
      { status: 500 },
    );
  }
}
