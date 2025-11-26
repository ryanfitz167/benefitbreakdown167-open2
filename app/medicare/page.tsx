import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medicare & Medicaid — Benefit Breakdown",
  description: "Medicare Parts A/B/D, Advantage, Medigap; Medicaid eligibility & basics.",
};

export default function MedicarePage() {
  return (
    <div className="container mx-auto px-4 py-10 lg:py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Medicare & Medicaid</h1>
      <p className="mt-2 text-lg muted max-w-3xl">Clear guides to federal and state programs.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card title="Medicare Basics" desc="When to enroll, penalties, Parts A/B/D" />
        <Card title="Advantage vs Medigap" desc="Compare structures & trade-offs" />
        <Card title="Medicaid Eligibility" desc="Income rules, how to apply, keeping coverage" />
        <Card title="Dual Eligibility" desc="How Medicare & Medicaid coordinate" />
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
