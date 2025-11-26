// components/ArticleCTA.tsx
"use client";

import { useState } from "react";
import clsx from "clsx";

type Props = {
  sourceSlug: string;
  articleTitle?: string;
  className?: string;
};

const USE_UNIFIED_ENDPOINT = false; // set true if you added /api/optin

export default function ArticleCTA({ sourceSlug, articleTitle, className }: Props) {
  const [email, setEmail] = useState("");
  const [wantsBroker, setWantsBroker] = useState(false);
  const [employees, setEmployees] = useState<string>("");
  const [comments, setComments] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [honeypot, setHoneypot] = useState(""); // ✅ honeypot

  const reset = () => {
    setEmail("");
    setWantsBroker(false);
    setEmployees("");
    setComments("");
    setConsent(false);
    setHoneypot("");
  };

  async function submitUnified() {
    const res = await fetch("/api/optin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        wantsBroker,
        employees: employees ? Number(employees) : undefined,
        comments: comments || undefined,
        sourceSlug,
        sourceTitle: articleTitle,
        honeypot, // ✅
      }),
    });
    return res;
  }

  async function submitSplit() {
    const news = await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, sourceSlug, sourceTitle: articleTitle, honeypot }), // ✅
    });
    if (!news.ok) return news;

    if (wantsBroker) {
      const broker = await fetch("/api/broker-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          employees: employees ? Number(employees) : undefined,
          comments: comments || undefined,
          sourceSlug,
          sourceTitle: articleTitle,
          honeypot, // ✅
        }),
      });
      return broker;
    }
    return news;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setMsg({ type: "error", text: "Please enter a valid email." });
      return;
    }
    if (!consent) {
      setMsg({ type: "error", text: "Please agree to the terms." });
      return;
    }

    setLoading(true);
    try {
      const res = USE_UNIFIED_ENDPOINT ? await submitUnified() : await submitSplit();
      if (res.ok) {
        setMsg({
          type: "success",
          text: wantsBroker
            ? "Thanks! You’re subscribed and we’ll connect you with a broker."
            : "Thanks! You’re subscribed to the newsletter.",
        });
        reset();
      } else {
        const text = await res.text();
        const friendly =
          res.status === 409
            ? "Looks like this email is already on our list."
            : text || "Something went wrong. Please try again.";
        setMsg({ type: "error", text: friendly });
      }
    } catch {
      setMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={clsx(
        "rounded-2xl border bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900",
        className
      )}
      aria-labelledby="article-cta-title"
    >
      <h2 id="article-cta-title" className="text-2xl font-semibold">
        Get smarter on benefits — and talk to a broker (optional)
      </h2>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
        Join the Benefit Breakdown newsletter. If you want help now, check the box and we’ll connect you with a broker.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        {/* ✅ honeypot field (hidden) */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="cta-email">Email</label>
          <input
            id="cta-email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-base outline-none focus:ring-2 dark:border-neutral-700"
            autoComplete="email"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg border border-transparent px-4 py-2 font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 bg-blue-600 text-white"
          >
            {loading ? "Submitting…" : "Join newsletter"}
          </button>
        </div>

        <div className="space-y-2">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={wantsBroker}
              onChange={(e) => setWantsBroker(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm">I’d also like to be contacted by a benefits broker.</span>
          </label>

          {wantsBroker && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="cta-employees" className="block text-sm font-medium">
                  Benefit-eligible employees (optional)
                </label>
                <input
                  id="cta-employees"
                  type="number"
                  min={1}
                  placeholder="e.g., 85"
                  value={employees}
                  onChange={(e) => setEmployees(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-base outline-none focus:ring-2 dark:border-neutral-700"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="cta-comments" className="block text-sm font-medium">
                  Additional comments (optional)
                </label>
                <textarea
                  id="cta-comments"
                  rows={3}
                  placeholder="Share timing, goals, pain points, etc."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-base outline-none focus:ring-2 dark:border-neutral-700"
                />
              </div>
            </div>
          )}
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1"
          />
          <span>
            I agree to receive communications from Benefit Breakdown and understand I can unsubscribe at any time.
          </span>
        </label>

        {msg && (
          <div
            className={clsx(
              "rounded-md border px-3 py-2 text-sm",
              msg.type === "success"
                ? "border-green-300 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950 dark:text-green-200"
                : "border-red-300 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950 dark:text-red-200"
            )}
            role="status"
          >
            {msg.text}
          </div>
        )}
      </form>
    </section>
  );
}

