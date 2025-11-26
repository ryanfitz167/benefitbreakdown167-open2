import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  // Optional: add a secret header to secure this endpoint
  const path = "/blog";
  revalidatePath(path);
  return new Response(JSON.stringify({ revalidated: true, path }), { status: 200 });
}
