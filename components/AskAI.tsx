"use client";
import { useState } from "react";

export default function AskAI() {
  const [q, setQ] = useState("");
  const [a, setA] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setA(null); setErr(null); setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || "ask_failed");
      setA(data.answer);
    } catch (e:any) {
      setErr(e.message || "ask_failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl rounded-2xl border p-4">
      <form onSubmit={ask} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask about HSA vs FSA, ACA affordability, COBRA, plan types…"
          className="flex-1 rounded-xl border px-3 py-2"
        />
        <button
          disabled={loading || !q.trim()}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>

      {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
      {a && (
        <div className="prose mt-4 whitespace-pre-wrap">
          {a}
        </div>
      )}
    </div>
  );
}
