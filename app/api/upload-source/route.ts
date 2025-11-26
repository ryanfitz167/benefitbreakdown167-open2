// app/api/upload-source/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { promises as fs } from "fs";
import path from "path";

const schema = z.object({
  url: z.string().url(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url } = schema.parse(body);

    // Fetch HTML content from the URL
    const res = await fetch(url);
    const html = await res.text();

    // Use Readability (Mozilla) to extract clean content
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.content || !article.textContent) {
      return NextResponse.json({ error: "Could not extract content." }, { status: 400 });
    }

    // Format the source entry
    const newSource = {
      id: crypto.randomUUID(),
      url,
      title: article.title,
      content: article.textContent,
      fetchedAt: new Date().toISOString(),
    };

    // Save to data/sources.json (append)
    const filePath = path.join(process.cwd(), "data", "sources.json");
    let existing = [];
    try {
      const file = await fs.readFile(filePath, "utf-8");
      existing = JSON.parse(file);
    } catch {}

    const updated = [newSource, ...existing];
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2));

    return NextResponse.json({ message: "Source uploaded successfully.", title: article.title });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}