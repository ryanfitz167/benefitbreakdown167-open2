"use client";
import { useState } from "react";

export default function BrokerInquiry() {
  const [email, setEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [company, setCompany] = useState("");
  const [eligibleEmployees, setEligibleEmployees] = useState<string>("");
  const [comments, setComments] = useState("");
  const [want, setWant] = useState(true);
  const [ok, setOk] = useState<null | boolean>(null);
  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null); setMsg("");
    const res = await fetch("/api/forms/broker", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email, contactName, company,
        eligibleEmployees: eligibleEmployees ? Number(eligibleEmployees) : undefined,
        comments, wantBrokerContact: want, consent: true, source: "article-cta",
      }),
    });
    const data = await res.json();
    setOk(data.ok);
    setMsg(data.ok ? "Thanks—an advisor will follow up soon." : (data.error || "Something went wrong."));
    if (data.ok) {
      setEmail(""); setContactName(""); setCompany(""); setEligibleEmployees(""); setComments("");
      setWant(true);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border p-4">
      <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Talk to a broker</div>
      <div className="font-semibold mb-2">Connect with an employee benefits advisor</div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm">Work email *</label>
          <input type="email" required placeholder="you@company.com" className="rounded-lg border px-3 py-2"
                 value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="grid gap-2">
          <label className="text-sm">Your name</label>
          <input type="text" placeholder="Jane Doe" className="rounded-lg border px-3 py-2"
                 value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </div>

        <div className="grid gap-2">
          <label className="text-sm">Company</label>
          <input type="text" placeholder="Acme Inc." className="rounded-lg border px-3 py-2"
                 value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>

        <div className="grid gap-2">
          <label className="text-sm">Benefit-eligible employees (approx.)</label>
          <input type="number" min="1" placeholder="e.g., 85" className="rounded-lg border px-3 py-2"
                 value={eligibleEmployees} onChange={(e) => setEligibleEmployees(e.target.value)} />
        </div>

        <div className="md:col-span-2 grid gap-2">
          <label className="text-sm">Additional comments</label>
          <textarea placeholder="Tell us what you’re looking for…" className="min-h-[96px] rounded-lg border px-3 py-2"
                    value={comments} onChange={(e) => setComments(e.target.value)} />
        </div>
      </div>

      <label className="mt-3 inline-flex items-center gap-2">
        <input type="checkbox" checked={want} onChange={() => setWant(!want)} className="h-4 w-4" />
        <span className="text-sm">I’d like to be contacted by a broker</span>
      </label>

      <div className="mt-4 flex gap-3">
        <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          Send
        </button>
        {ok !== null && (
          <div className={`text-sm self-center ${ok ? "text-green-700" : "text-red-700"}`}>{msg}</div>
        )}
      </div>
    </form>
  );
}
