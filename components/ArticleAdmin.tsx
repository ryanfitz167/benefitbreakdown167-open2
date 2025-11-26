"use client";

import { useState } from "react";

export default function ArticleAdmin() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [generatedArticle, setGeneratedArticle] = useState("");

  const generateArticle = async () => {
    setStatus("generating");

    try {
      const res = await fetch("/api/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category: category.trim(),
          subcategory: subcategory.trim(),
          description: description.trim(),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to generate article: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      setGeneratedArticle(data.article || "No article returned.");
      setStatus("done");
    } catch (err) {
      console.error("Article generation failed:", err);
      setStatus("error");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">✍️ AI Article Generator</h2>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter article title"
        className="w-full border border-gray-300 rounded px-3 py-2"
      />

      <div className="flex gap-2">
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="flex-1 border border-gray-300 rounded px-3 py-2"
        />
        <input
          type="text"
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
          placeholder="Subcategory"
          className="flex-1 border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What should this article talk about? (e.g. audience, tone, key points)"
        rows={4}
        className="w-full border border-gray-300 rounded px-3 py-2"
      />

      <button
        onClick={generateArticle}
        disabled={
          status === "generating" ||
          !title.trim() ||
          !category.trim() ||
          !subcategory.trim()
        }
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {status === "generating" ? "Generating..." : "Generate Article"}
      </button>

      {status === "done" && (
        <div className="mt-6 bg-gray-50 p-4 rounded shadow">
          <h3 className="text-lg font-bold mb-2">Generated Article</h3>
          <article className="whitespace-pre-wrap">{generatedArticle}</article>
        </div>
      )}

      {status === "error" && (
        <p className="text-red-500 mt-2">❌ Error generating article. Check console for details.</p>
      )}
    </div>
  );
}
