// FILE: app/admin/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { TOPICS, type TopicSlug, slugToTitle } from "@/lib/topics";

type Draft = {
  title: string;
  dek: string;
  bodyMarkdown: string;
  tags: string[];
  sources: Array<{ title: string; url: string; publisher?: string; date?: string }>;
  imageBase64?: string;
  image_prompt?: string;
};

type Health = {
  generate_provider: "proxy" | "openai" | "unconfigured";
  image_provider: "proxy" | "openai" | "unconfigured";
  AI_GENERATE_URL: string | null;
  AI_IMAGE_URL: string | null;
  OPENAI_MODEL: string;
  has_OPENAI_API_KEY: boolean;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

// Build a context-aware, safe image prompt.
function buildImagePrompt(d: Draft): string {
  const bullets = d.bodyMarkdown
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[-*]\s+/.test(l) || /^\*\*.+\*\*$/.test(l))
    .slice(0, 6)
    .join(" ");
  return [
    `Editorial, non-copyrighted illustration about: ${d.title}`,
    d.dek ? `Summary: ${d.dek}` : "",
    bullets ? `Key points: ${bullets}` : "",
    "Style: clean, neutral, professional; no brands/logos/text; no real people; simple shapes.",
  ]
    .filter(Boolean)
    .join(". ");
}

const ORIENTATION_TO_SIZE = {
  landscape: "1536x1024",
  portrait: "1024x1536",
  square: "1024x1024",
} as const;

export default function AdminPage() {
  const [health, setHealth] = useState<Health | null>(null);

  const [topic, setTopic] = useState<TopicSlug>("in-the-news");
  const [minutes, setMinutes] = useState(5);
  const [brief, setBrief] = useState("");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [published, setPublished] = useState<{ slug: string; path: string } | null>(null);

  // Generation timer + cancel
  const [genElapsed, setGenElapsed] = useState(0);
  const genAbortRef = useRef<AbortController | null>(null);
  const genTickRef = useRef<number | null>(null);

  // Live preview state
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const previewAbortRef = useRef<AbortController | null>(null);

  // Image orientation (enforces valid sizes)
  const [orientation, setOrientation] = useState<"landscape" | "portrait" | "square">("landscape");

  useEffect(() => {
    fetch("/api/health/ai", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setHealth(j))
      .catch(() => setHealth(null));
  }, []);

  // Debounced server-rendered Markdown preview
  const combinedMarkdown = useMemo(() => {
    const t = draft?.title?.trim() || "(untitled)";
    const dek = draft?.dek?.trim() || "";
    const body = draft?.bodyMarkdown || "";
    return `# ${t}\n${dek ? `> ${dek}\n\n` : ""}${body}`;
  }, [draft?.title, draft?.dek, draft?.bodyMarkdown]);

  useEffect(() => {
    if (!draft) {
      setPreviewHtml("");
      return;
    }
    const ac = new AbortController();
    previewAbortRef.current?.abort();
    previewAbortRef.current = ac;
    setPreviewBusy(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/preview-markdown", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ markdown: combinedMarkdown }),
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(await res.text());
        const { html } = await res.json();
        setPreviewHtml(html || "");
      } catch {
        // ignore preview errors
      } finally {
        setPreviewBusy(false);
      }
    }, 250); // debounce
    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [combinedMarkdown, draft]);

  function startTimer() {
    setGenElapsed(0);
    const started = performance.now();
    stopTimer();
    genTickRef.current = window.setInterval(() => {
      setGenElapsed(Math.round((performance.now() - started) / 1000));
    }, 200);
  }
  function stopTimer() {
    if (genTickRef.current) {
      clearInterval(genTickRef.current);
      genTickRef.current = null;
    }
  }

  async function generateDraft() {
    setErr(null);
    setBusy(true);
    setPublished(null);

    const ac = new AbortController();
    genAbortRef.current = ac;
    startTimer();

    try {
      const res = await fetch("/api/generate-article", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: ac.signal,
        body: JSON.stringify({ topic, prompt: brief, minutes }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDraft({
        title: data.title,
        dek: data.dek || "",
        bodyMarkdown: data.bodyMarkdown || "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        sources: data.sources || [],
        image_prompt: data.image_prompt,
      });
    } catch (e: any) {
      setErr(e?.name === "AbortError" ? "Generation cancelled." : e?.message || "Generation failed.");
    } finally {
      setBusy(false);
      stopTimer();
      genAbortRef.current = null;
    }
  }

  function cancelGenerate() {
    genAbortRef.current?.abort(); // let you stop long jobs
  }

  async function generateImage() {
    if (!draft?.title && !draft?.image_prompt) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: draft?.image_prompt || buildImagePrompt(draft!),
          size: ORIENTATION_TO_SIZE[orientation], // always valid size
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDraft({ ...draft!, imageBase64: `data:image/png;base64,${data.base64}` });
    } catch (e: any) {
      setErr(e?.message || "Image generation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!draft) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          dek: draft.dek,
          topicSlug: topic, // already a canonical slug
          tags: draft.tags,
          bodyMarkdown: draft.bodyMarkdown,
          sources: draft.sources,
          imageBase64: draft.imageBase64,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPublished({ slug: data.slug, path: data.path });
    } catch (e: any) {
      setErr(e?.message || "Publish failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-[1200px] mx-auto my-8 px-4 space-y-6">
      {/* AI status */}
      {health && (
        <div className="border border-neutral-200 rounded-xl p-3 text-sm bg-neutral-50">
          <b>AI status:</b>{" "}
          Articles → <code>{health.generate_provider}</code>
          {health.generate_provider === "proxy" && health.AI_GENERATE_URL ? <> via <code>{health.AI_GENERATE_URL}</code></> : null}
          {" · "}Images → <code>{health.image_provider}</code>
          {health.image_provider === "proxy" && health.AI_IMAGE_URL ? <> via <code>{health.AI_IMAGE_URL}</code></> : null}
          {" · "}Model: <code>{health.OPENAI_MODEL}</code>
          {" · "}OPENAI key: <code>{health.has_OPENAI_API_KEY ? "present" : "missing"}</code>
        </div>
      )}

      {/* Controls */}
      <section className="border border-neutral-200 rounded-2xl p-6 bg-neutral-50">
        <h1 className="m-0 text-2xl font-semibold">Admin — Generate & Publish Article</h1>
        <p className="m-0 mt-2 text-neutral-700">
          Choose a topic, write a brief, generate a draft (with sources), preview, add an image, and publish.
        </p>
      </section>

      <section className="border border-neutral-200 rounded-2xl p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">Topic</label>
            <select
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black bg-white"
              value={topic}
              onChange={(e) => setTopic(e.target.value as TopicSlug)}
            >
              {TOPICS.filter((t) => t.slug !== "trending").map((t) => (
                <option key={t.slug} value={t.slug}>
                  {slugToTitle(t.slug)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Target length (minutes)</label>
            <input
              type="range"
              min={3}
              max={10}
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value))}
              className="mt-3 w-full"
            />
            <div className="text-xs text-neutral-600 mt-1">{minutes} min read</div>
          </div>

          <div className="md:col-span-1 flex items-end gap-2">
            {!busy ? (
              <button
                onClick={generateDraft}
                disabled={!brief.trim()}
                className={cls(
                  "px-4 py-2 rounded-lg bg-black text-white hover:opacity-90",
                  !brief.trim() && "opacity-60"
                )}
              >
                Generate Draft
              </button>
            ) : (
              <button
                type="button"
                onClick={cancelGenerate}
                className="px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50"
              >
                Stop
              </button>
            )}
            {busy && <span className="text-xs text-neutral-600 self-center">Generating… {genElapsed}s</span>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Brief for AI</label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g., Summarize the latest CMS final rule impacting ACA Marketplace plans and implications for employers."
            className="mt-1 w-full h-28 rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{err}</div>}
      </section>

      {/* Editor + Preview side-by-side */}
      {draft && (
        <section className="border border-neutral-200 rounded-2xl p-6">
          <h2 className="m-0 text-xl font-semibold mb-4">Edit & Preview</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Editor */}
            <div className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium">Title</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Dek (one-sentence summary)</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                    value={draft.dek}
                    onChange={(e) => setDraft({ ...draft, dek: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Body (Markdown with [n] citations, **bold** subheads)</label>
                <textarea
                  className="mt-1 w-full h-80 rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black font-mono text-[13px]"
                  value={draft.bodyMarkdown}
                  onChange={(e) => setDraft({ ...draft, bodyMarkdown: e.target.value })}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Keep it scannable; use **bold** subheads. Ensure [n] maps to Sources 1..n.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium">Tags (comma-separated)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                  value={draft.tags.join(", ")}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      tags: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium">Header Image</label>
                  <div className="flex items-center gap-3 mt-1">
                    <select
                      className="rounded-lg border border-neutral-300 px-3 py-2 bg-white"
                      value={orientation}
                      onChange={(e) => setOrientation(e.target.value as any)}
                      title="Orientation"
                    >
                      <option value="landscape">Landscape (1536×1024)</option>
                      <option value="portrait">Portrait (1024×1536)</option>
                      <option value="square">Square (1024×1024)</option>
                    </select>
                    <button
                      onClick={generateImage}
                      disabled={busy}
                      className={cls(
                        "px-3 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50",
                        busy && "opacity-60"
                      )}
                    >
                      {busy ? "Generating…" : "Generate Image"}
                    </button>
                    {draft.imageBase64 && <span className="text-xs text-neutral-600">Ready</span>}
                  </div>
                  {draft.imageBase64 && (
                    <div className="mt-3 border border-neutral-200 rounded-xl overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={draft.imageBase64} alt="Generated" className="w-full h-auto" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium">Sources (auto-filled)</label>
                  <ol className="mt-1 text-sm text-neutral-700 list-decimal pl-5 space-y-1">
                    {draft.sources.map((s, i) => (
                      <li key={i}>
                        <a className="underline underline-offset-4" href={s.url} target="_blank" rel="noreferrer">
                          {s.title}
                        </a>
                        {s.publisher ? ` — ${s.publisher}` : ""}
                        {s.date ? `, ${s.date}` : ""}
                      </li>
                    ))}
                  </ol>
                  <p className="text-xs text-neutral-500 mt-1">At least two credible sources; align with [n] citations.</p>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="border border-neutral-200 rounded-xl p-4 bg-white">
              <h3 className="m-0 text-lg font-semibold mb-2">Live Preview</h3>
              {previewBusy && <div className="text-xs text-neutral-500 mb-2">Rendering preview…</div>}
              <article className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={publish}
              disabled={busy}
              className={cls("px-4 py-2 rounded-lg bg-black text-white hover:opacity-90", busy && "opacity-60")}
            >
              {busy ? "Publishing…" : "Publish to Site"}
            </button>

            {published && (
              <div className="text-sm">
                Published:{" "}
                <Link href={published.path} className="underline underline-offset-4 hover:opacity-80">
                  {published.path}
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
