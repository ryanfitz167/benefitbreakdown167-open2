"use client";
import Link from "next/link";

export default function FloatingAskAI() {
  return (
    <Link
      href="/ask"
      className="fixed bottom-5 right-5 z-40 rounded-full bg-blue-600 px-4 py-2 text-white shadow-lg hover:bg-blue-700"
      aria-label="Ask AI about benefits"
    >
      Ask AI
    </Link>
  );
}
