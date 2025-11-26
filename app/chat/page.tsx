// app/chat/page.tsx
"use client";

import dynamic from "next/dynamic";

// Dynamically import the AskAI component with SSR disabled
const AskAI = dynamic(() => import("@/components/AskAI"), {
  ssr: false,
});

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-white p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">💬 Ask the AI</h1>
      <AskAI />
    </main>
  );
}
