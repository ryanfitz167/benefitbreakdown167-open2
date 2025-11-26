import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employer Playbooks — Benefit Breakdown",
  description: "Checklists, timelines, and vendor tips for HR & benefits admins.",
};

export default function EmployerPage() {
  return (
    <div className="container mx-auto px-4 py-10 lg:py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Employer Playbooks</h1>
      <p className="mt-2 text-lg muted max-w-3xl">Practical how-tos for running plans with confidence.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card title="Open Enrollment Project Plan" desc="Timeline, comms, vendor coordination" />
        <Card title="Broker RFP Checklist" desc="Questions, evaluation, references" />
        <Card title="Compliance Calendar" desc="Deadlines, filings, notices" />
        <Card title="Renewal Strategy" desc="Utilization review, plan changes, employee impact" />
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