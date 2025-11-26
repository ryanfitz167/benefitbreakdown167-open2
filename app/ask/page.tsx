// app/ask/page.tsx
"use client";

import { useState } from "react";

/** Strong TS types so role/newMessages never go red */
type Role = "user" | "assistant";
type ChatMessage = { role: Role; text: string };

const EXAMPLES: string[] = [
  "What is ACA affordability and how is it calculated?",
  "COBRA vs. state continuation—what’s the difference?",
  "What’s the difference between deductible, copay, and coinsurance?",
  "HSA vs. FSA—how do they work?",
  "Do part-time employees qualify for benefits?",
  "What are qualifying life events (QLEs)?",
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "What’s a deductible?",
    a: "The deductible is the amount you pay out of pocket each plan year before your plan starts sharing costs for covered services (except for services with copays like many office visits or prescriptions, depending on the plan).",
  },
  {
    q: "What’s the difference between copay and coinsurance?",
    a: "A copay is a fixed dollar amount (e.g., $25 per visit). Coinsurance is a percentage of the allowed cost (e.g., 20% after deductible). Some plans use both depending on the service.",
  },
  {
    q: "What counts toward the out-of-pocket maximum?",
    a: "Your deductible, eligible copays, and coinsurance for covered, in-network services. Premiums generally do not count. Once you hit the max, the plan pays 100% of covered, in-network costs for the rest of the plan year.",
  },
  {
    q: "HSA vs. FSA—what’s the difference?",
    a: "HSAs pair with HSA-eligible high deductible plans; funds roll over year to year and are yours to keep. FSAs work with many plan types; funds are use-it-or-lose-it (with limited carryover or grace period, if offered).",
  },
  {
    q: "Do preventive services cost me anything?",
    a: "Most in-network preventive services (e.g., annual physicals, certain screenings, vaccines) are covered at 100% with no deductible or copay, per ACA rules. Check your plan’s list for what’s included.",
  },
  {
    q: "What is COBRA and how long does it last?",
    a: "COBRA lets you continue your employer coverage after certain events (like job loss) by paying the full premium plus a small admin fee. Most qualifying events allow up to 18 months; some allow up to 36 months.",
  },
  {
    q: "What’s a qualifying life event (QLE)?",
    a: "Events like marriage, birth/adoption, loss of other coverage, or moving can trigger a special enrollment period to change your elections mid-year. Most QLE windows are 30 days—check your plan rules.",
  },
  {
    q: "How do in-network vs. out-of-network benefits work?",
    a: "In-network providers have contracts with the plan and lower negotiated rates. Out-of-network services usually cost more and may be subject to balance billing. Some plans (like HMOs) may not cover out-of-network care except emergencies.",
  },
  {
    q: "What happens if I don’t enroll during open enrollment?",
    a: "You typically must wait until the next open enrollment unless you have a qualifying life event. Some employer plans require active elections each year—otherwise your coverage may default.",
  },
  {
    q: "How are prescriptions covered?",
    a: "Plans use a drug formulary with tiers (generic, preferred brand, non-preferred, specialty). Copays/coinsurance vary by tier and may require step therapy or prior authorization for certain medications.",
  },
];

export default function AskPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const send = async (text: string) => {
    const question = text.trim();
    if (!question) return;

    // append user message (use const assertions so TS keeps the literal type)
    const newMessages = [...messages, { role: "user" as const, text: question }];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = (await res.json()) as { answer?: string };
      setMessages([
        ...newMessages,
        { role: "assistant" as const, text: data.answer ?? "..." },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant" as const, text: "Error: could not fetch response." },
      ]);
    }
  };

  const onSendClick = () => send(input);
  const onExampleClick = (q: string) => send(q);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Ask AI</h1>
      <p className="mb-6 text-sm text-slate-600">
        Ask a benefits question below. This tool provides general information and{" "}
        <span className="font-semibold">is not legal or medical advice</span>.
      </p>

      {/* Example question chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {EXAMPLES.map((q) => (
          <button
            key={q}
            onClick={() => onExampleClick(q)}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Window */}
      <div className="mb-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm max-h-[60vh] overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500">
            Try “What is ACA affordability and how is it calculated?”
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input box */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSendClick()}
          placeholder="Type your question…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring"
        />
        <button
          onClick={onSendClick}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Send
        </button>
      </div>

      {/* Disclaimer */}
      <p className="mt-3 text-xs text-slate-500">
        ⚠️ This chatbot provides general information about health benefits. It
        does not provide legal or medical advice.
      </p>

      {/* FAQs */}
      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold">Top Questions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {FAQS.map((item, idx) => (
            <details
              key={idx}
              className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
                <span className="mr-2 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {(idx + 1).toString().padStart(2, "0")}
                </span>
                {item.q}
                <span className="float-right text-slate-400 transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-700">{item.a}</p>
              <p className="mt-3 text-[11px] text-slate-500">
                Not advice. Coverage varies by plan.
              </p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
