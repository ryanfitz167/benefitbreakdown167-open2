"use client";
import { useState } from "react";

export default function NewsletterOptIn({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [ok, setOk] = useState<null | boolean>(null);
  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null); setMsg("");
    const res = await fetch("/api/forms/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, name, consent: true, source: "article-cta" }),
    });
    const data = await res.json();
    setOk(data.ok);
    setMsg(data.ok ? "You're subscribed! Check your inbox." : (data.error || "Something went wrong."));
    if (data.ok) { setEmail(""); setName(""); }
  }

  return (
    <form onSubmit={onSubmit} className={`rounded-2xl border p-4 ${compact ? "md:flex md:items-end md:gap-3" : ""}`}>
      <div className="mb-2">
        <div className="text-xs uppercase tracking-wide text-neutral-500">Newsletter</div>
        <div className="font-semibold">Plain-English benefits insights</div>
        {!compact && <p className="text-sm text-neutral-600">No spam. One email, occasionally.</p>}
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        <input
          type="text" placeholder="Your name (optional)"
          className="rounded-lg border px-3 py-2"
          value={name} onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email" required placeholder="you@example.com"
          className="rounded-lg border px-3 py-2 md:col-span-2"
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button type="submit" className="mt-3 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 md:mt-0">
        Subscribe
      </button>
      {ok !== null && (
        <div className={`mt-2 text-sm ${ok ? "text-green-700" : "text-red-700"}`}>{msg}</div>
      )}
    </form>
  );
}
