// components/NewsletterSection.tsx
"use client";

import { useState } from "react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try {
      setStatus("loading");
      await new Promise(r => setTimeout(r, 500));
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="border-t bg-slate-50">
      <div className="container py-10 md:py-14">
        <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-xl md:text-2xl font-semibold text-slate-900">
            Get Compliance & Benefits Updates
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Subscribe for concise ACA, compliance, and plan-design news.
          </p>

          <form onSubmit={onSubmit} className="mt-4 flex gap-2">
            <input
              type="email"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {status === "loading" ? "Subscribing…" : "Subscribe"}
            </button>
          </form>

          {status === "success" && (
            <p className="mt-3 text-sm text-green-700">Check your inbox to confirm.</p>
          )}
          {status === "error" && (
            <p className="mt-3 text-sm text-red-700">Something went wrong. Try again.</p>
          )}
        </div>
      </div>
    </section>
  );
}
