import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import * as path from "path";
import slugify from "slugify";

function insertImageUnderTitle(mdx: string, publicImagePath: string, alt: string) {
  const lines = mdx.split("\n");

  // Skip frontmatter if present
  let startIdx = 0;
  if (mdx.startsWith("---")) {
    const fmEnd = mdx.indexOf("\n---", 3);
    if (fmEnd !== -1) startIdx = fmEnd + 2; // position at the '---' line
  }

  // Find first H1
  let i = startIdx;
  while (i < lines.length && !lines[i].startsWith("# ")) i++;

  const imgBlock = `\n![${alt}](${publicImagePath})\n`;

  if (i < lines.length) {
    const nextLine = lines[i + 1] ?? "";
    const alreadyHasImage = nextLine.trim().startsWith("![") || nextLine.trim().startsWith("<img");
    if (!alreadyHasImage) {
      lines.splice(i + 1, 0, imgBlock);
      return lines.join("\n");
    }
    return mdx; // already has an image directly under H1
  }

  // fallback: put after frontmatter if no H1 found
  if (mdx.startsWith("---")) {
    const fmEnd = mdx.indexOf("\n---", 3);
    if (fmEnd !== -1) {
      const head = mdx.slice(0, fmEnd + 4);
      const body = mdx.slice(fmEnd + 4);
      return `${head}\n\n${imgBlock}${body}`;
    }
  }

  // fallback: prepend
  return `${imgBlock}${mdx}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, content, mainCategory, subCategory, imageUrl } = body as {
      title: string;
      content: string;
      mainCategory: string;
      subCategory: string;
      imageUrl?: string;
    };

    if (!title || !content || !mainCategory || !subCategory) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    const category = String(mainCategory).trim().toLowerCase();
    const subcategory = String(subCategory).trim().toLowerCase();
    const slug = slugify(String(title), { lower: true, strict: true });

    const dir = path.join(process.cwd(), "public", "articles", category, subcategory);
    await fs.mkdir(dir, { recursive: true });

    // optional: fetch and save image
    let imageWebPath: string | undefined;
    if (imageUrl) {
      try {
        const res = await fetch(imageUrl);
        const buffer = Buffer.from(await res.arrayBuffer());
        const imageFs = path.join(dir, `${slug}.png`);
        await fs.writeFile(imageFs, buffer);
        imageWebPath = `/articles/${category}/${subcategory}/${slug}.png`;
      } catch {
        // ignore image errors
      }
    }

    // ensure MDX has frontmatter; if not, add minimal
    const dateIso = new Date().toISOString();
    let finalMDX = content;
    if (!finalMDX.trim().startsWith("---")) {
      const fm =
        `---\n` +
        `title: ${JSON.stringify(title)}\n` +
        `description: ""\n` +
        `date: ${JSON.stringify(dateIso)}\n` +
        `category: ${JSON.stringify(category)}\n` +
        `subcategory: ${JSON.stringify(subcategory)}\n` +
        `readingTime: "3–5 min"\n` +
        `---\n\n`;
      finalMDX = fm + finalMDX;
    }

    // inject image under the H1 if we saved one
    if (imageWebPath) {
      finalMDX = insertImageUnderTitle(finalMDX, imageWebPath, title);
    }

    const mdxFs = path.join(dir, `${slug}.mdx`);
    await fs.writeFile(mdxFs, finalMDX, "utf8");

    return NextResponse.json({
      message: "Article uploaded successfully!",
      routePath: `/${category}/${subcategory}/${slug}`, // 👈 link this to view the page
      filePath: mdxFs,
      imagePath: imageWebPath,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ message: "Upload failed.", error: String(err) }, { status: 500 });
  }
}
