import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Using Your Benefits — Benefit Breakdown",
  description: "Practical steps to get care and save money.",
};

export default function HowToPage() {
  return (
    <div className="container mx-auto px-4 py-10 lg:py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Using Your Benefits</h1>
      <p className="mt-2 text-lg muted max-w-3xl">Step-by-step guides you can actually use.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card title="Find In-Network Care" desc="Search tools, verifying providers, referrals" />
        <Card title="Lower Your Rx Costs" desc="Generics, discount cards, prior auth tips" />
        <Card title="Estimate Costs" desc="Deductible, coinsurance, OOP max explained" />
        <Card title="Use an HSA/FSA" desc="Eligible expenses, receipts, tax tips" />
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
