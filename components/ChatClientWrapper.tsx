// components/ChatClientWrapper.tsx
"use client";

import dynamic from "next/dynamic";

// Dynamically load the Chatbot component client-side only
const Chatbot = dynamic(() => import("./Chatbot"), {
  ssr: false,
});

export default function ChatClientWrapper() {
  return <Chatbot />;
}
