// components/Chatbot.tsx
"use client";

import { useState } from "react";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: "system", content: "You are a helpful health benefits assistant." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      const reply = data.choices?.[0]?.message;
      if (reply) setMessages([...newMessages, reply]);
    } catch (err) {
      console.error("Chat error:", err);
    }

    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded-xl shadow">
      <div className="h-80 overflow-y-auto space-y-3 mb-4">
        {messages.slice(1).map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <p className="bg-gray-100 p-2 rounded-md inline-block">
              <strong>{m.role === "user" ? "You" : "AI"}:</strong> {m.content}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="border flex-1 p-2 rounded-md"
          placeholder="Ask a health benefits question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md"
          onClick={sendMessage}
          disabled={loading}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
