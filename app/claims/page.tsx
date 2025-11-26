import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Claims, Bills & Appeals — Benefit Breakdown",
  description: "Decode EOBs, fix surprise bills, and file appeals.",
};

export default function ClaimsPage() {
  return (
    <div className="container mx-auto px-4 py-10 lg:py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Claims, Bills & Appeals</h1>
      <p className="mt-2 text-lg muted max-w-3xl">Understand the paperwork—and what to do next.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card title="Read Your EOB" desc="What each line means, common codes" />
        <Card title="Surprise Bills" desc="Rights, timelines, who to call" />
        <Card title="File an Appeal" desc="Step-by-step, timelines, templates" />
        <Card title="Keep Records" desc="Docs to save, tracking calls & letters" />
      </div>
    </div>
  );
}
function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="text-lg font-bold text-slate-900">{title}</div>
      <p className="mt-1 muted">{desc}</p>
    </div>
  );
}
