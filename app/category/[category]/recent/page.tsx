// app/category/[category]/recent/page.tsx
import { redirect } from "next/navigation";

type Params = { category: string };

export default async function RecentAlias({
  params,
}: {
  params: Params | Promise<Params>;
}) {
  const p = (params as any)?.then ? await (params as Promise<Params>) : (params as Params);
  redirect(`/category/${encodeURIComponent(p.category)}`);
}
