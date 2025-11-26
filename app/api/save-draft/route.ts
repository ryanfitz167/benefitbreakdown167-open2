import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const { article, topic } = await req.json();
  const dir = path.join(process.cwd(), "data", "drafts");

  await fs.mkdir(dir, { recursive: true });

  const filename = `${uuidv4()}-${topic.replace(/[^a-zA-Z0-9]/g, "_")}.md`;
  await fs.writeFile(path.join(dir, filename), article);

  return NextResponse.json({ success: true, filename });
}
