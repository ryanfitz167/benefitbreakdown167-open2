import AskAI from "@/components/AskAI";

export const dynamic = "force-dynamic";

export default function AskPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">Ask AI (Benefits Only)</h1>
      <p className="mb-4 text-sm text-slate-600">
        Ask questions about employee benefits and health insurance. Off-topic questions will be declined.
      </p>
      <AskAI />
    </main>
  );
}
