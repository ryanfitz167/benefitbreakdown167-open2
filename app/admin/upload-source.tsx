// app/admin/upload-source.tsx
"use client";

import { useState } from "react";

export default function UploadSourcePage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const res = await fetch("/api/upload-source", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    if (res.ok) {
      setStatus("done");
      setMessage("✅ Source added successfully.");
      setUrl("");
    } else {
      setStatus("error");
      setMessage(data.error || "❌ Something went wrong.");
    }
  }

  return (
    <main className="min-h-screen bg-white p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📥 Upload Source URL</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border p-2 rounded"
          placeholder="Enter article URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          type="submit"
          disabled={status === "loading" || !url.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {status === "loading" ? "Uploading..." : "Fetch & Add Source"}
        </button>
      </form>

      {message && <p className="mt-4 text-sm text-slate-700">{message}</p>}
    </main>
  );
}
