// FILE: app/ask-ai/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Role = "user" | "assistant" | "system";
type ChatMessage = { role: Role; content: string };

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function AskAIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "system",
      content:
        "You are Benefit Breakdown's assistant. Explain health insurance in plain English. Be concise, practical, and note trade-offs when relevant.",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const displayMessages = useMemo(
    () => messages.filter((m) => m.role !== "system"),
    [messages]
  );

  useEffect(() => {
    // Auto-resize textarea (UX nicety)
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(220, Math.max(56, ta.scrollHeight)) + "px";
  }, [input]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const q = input.trim();
    if (!q || busy) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setStreaming("");
    setBusy(true);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          // Why: Generic OpenAI-like shape; API proxy forwards as-is
          messages: next.map(({ role, content }) => ({ role, content })),
          stream: true,
        }),
        signal: ac.signal,
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(detail || `HTTP ${res.status}`);
      }

      // Stream if possible; else read full text
      const reader = res.body?.getReader();
      if (!reader) {
        const text = await res.text();
        setStreaming(text);
        setMessages([...next, { role: "assistant", content: text }]);
        return;
      }

      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreaming(acc);
      }
      setMessages([...next, { role: "assistant", content: acc }]);
      setStreaming("");
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err?.message || "Something went wrong.");
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  return (
    <main className="max-w-[900px] mx-auto px-4 my-8 space-y-6">
      {/* Hero */}
      <section className="border border-neutral-200 rounded-2xl p-6 bg-neutral-50">
        <h1 className="m-0 text-2xl font-semibold">Ask AI about Benefits</h1>
        <p className="m-0 mt-2 text-neutral-700">
          Get plain-English answers to health insurance questions. This uses our live AI backend.
        </p>
      </section>

      {/* Chat window */}
      <section className="border border-neutral-200 rounded-2xl">
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
          {displayMessages.length === 0 && !streaming && (
            <div className="text-sm text-neutral-600">
              Try: <em>“What’s the difference between HMO and PPO?”</em> or{" "}
              <em>“How do deductibles and out-of-pocket maximums interact?”</em>
            </div>
          )}

          {displayMessages.map((m, idx) => (
            <MessageBubble key={idx} role={m.role} content={m.content} />
          ))}

          {streaming && <MessageBubble role="assistant" content={streaming} streaming />}
        </div>

        {/* Composer */}
        <form onSubmit={handleSubmit} className="border-t border-neutral-200 p-4 space-y-3">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
              {error}
            </div>
          )}
          <div className="flex items-end gap-3">
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question…"
              className="flex-1 rounded-xl border border-neutral-300 px-3 py-3 outline-none focus:ring-2 focus:ring-black"
              rows={2}
              maxLength={4000}
              disabled={busy}
            />
            <div className="flex gap-2">
              {!busy ? (
                <button
                  type="submit"
                  className={cn(
                    "px-4 py-2 rounded-lg bg-black text-white hover:opacity-90",
                    input.trim() ? "" : "opacity-60 cursor-not-allowed"
                  )}
                  disabled={!input.trim()}
                >
                  Ask
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStop}
                  className="px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50"
                >
                  Stop
                </button>
              )}
            </div>
          </div>
          <div className="text-xs text-neutral-500 flex items-center justify-between">
            <span>AI can make mistakes; verify important info.</span>
            <Link href="/topics/definitions" className="underline underline-offset-4 hover:opacity-80">
              Browse definitions
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

function MessageBubble({ role, content, streaming = false }: { role: Role; content: string; streaming?: boolean }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-[15px] leading-relaxed",
          isUser ? "bg-black text-white" : "bg-neutral-100 text-neutral-900"
        )}
      >
        {content}
        {streaming && <span className="opacity-60">▍</span>}
      </div>
    </div>
  );
}