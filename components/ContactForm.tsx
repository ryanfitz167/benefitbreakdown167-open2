// FILE: components/ContactForm.tsx
"use client";
import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("General");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function mailtoEncode(s: string) {
    return encodeURIComponent(s).replace(/%0A/g, "%0D%0A");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !message) return alert("Please include your email and a short message.");
    setBusy(true);
    try {
      // Why: Works without backend; users can send via their email client.
      const subject = `Benefit Breakdown Contact — ${topic}`;
      const body = `Name: ${name || "(not provided)"}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`;
      const href = `mailto:benefitbreakdownhelp@gmail.com?subject=${mailtoEncode(subject)}&body=${mailtoEncode(body)}`;
      window.location.href = href;
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email *</label>
          <input
            required
            type="email"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Topic</label>
        <select
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black bg-white"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          <option>General</option>
          <option>Content question</option>
          <option>Partnership</option>
          <option>Press</option>
          <option>Feedback</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Message *</label>
        <textarea
          required
          className="mt-1 w-full h-40 rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          disabled={busy}
          type="submit"
          className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Launching email…" : "Send message"}
        </button>
        <a
          href="mailto:benefitbreakdownhelp@gmail.com"
          className="text-sm underline underline-offset-4 hover:opacity-80"
        >
          Or email us directly
        </a>
      </div>
    </form>
  );
}