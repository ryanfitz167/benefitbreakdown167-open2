"use client";

import { useState } from "react";

export default function UploadSourcePage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleUpload() {
    if (!url.trim()) return;
    setStatus("loading");
    setMessage("");

    const res = await fetch("/api/upload-source", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    if (res.ok) {
      setStatus("success");
      setMessage(`✅ Added: ${data.title}`);
      setUrl("");
    } else {
      setStatus("error");
      setMessage(`❌ Error: ${data.error}`);
    }
  }

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔗 Upload Source Link</h1>
      <input
        type="url"
        placeholder="https://example.com/article"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />
      <button
        onClick={handleUpload}
        disabled={status === "loading"}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {status === "loading" ? "Uploading..." : "Upload"}
      </button>

      {message && (
        <div className={`mt-4 ${status === "success" ? "text-green-600" : "text-red-600"}`}>
          {message}
        </div>
      )}
    </main>
  );
}
