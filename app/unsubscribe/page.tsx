import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribe — Benefit Breakdown",
  description: "Remove your email from the newsletter.",
};

export default function UnsubscribePage() {
  return (
    <div className="container py-12">
      <div className="mx-auto max-w-lg card">
        <h1 className="h2">Unsubscribe</h1>
        <p className="mt-2 muted">Enter your email to remove it from our newsletter list.</p>

        <form method="POST" action="/api/unsubscribe" className="mt-4 grid gap-3">
          <input
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            className="w-full rounded-xl border px-4 py-2 outline-none ring-0 focus:border-blue-600 dark:border-slate-700"
          />
          <button className="rounded-xl bg-blue-700 px-5 py-2 font-medium text-white hover:bg-blue-800">
            Unsubscribe
          </button>
        </form>

        <p className="mt-3 text-xs muted">We’ll immediately honor your request.</p>
      </div>
    </div>
  );
}
