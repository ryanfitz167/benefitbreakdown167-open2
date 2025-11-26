import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compliance & Regulations — Benefit Breakdown",
  description: "ACA, COBRA, HIPAA, ERISA, MHPAEA, PCORI — what changed and what to do.",
};

export default function CompliancePage() {
  return (
    <div className="container mx-auto px-4 py-10 lg:py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Compliance & Regulations</h1>
      <p className="mt-2 text-lg muted max-w-3xl">Plain-English summaries of federal and state requirements.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card title="ACA" desc="ALE rules, affordability, reporting, OOP max" />
        <Card title="COBRA" desc="Eligibility, timelines, notices, second events" />
        <Card title="HIPAA" desc="Privacy, security, special enrollment, NPP" />
        <Card title="MHPAEA" desc="Comparative analyses, enforcement trends" />
        <Card title="PCORI" desc="Fees by plan year, deadlines" />
        <Card title="ERISA" desc="Plan docs, fiduciary duties, SPD/SMM" />
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
