"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TOPICS, type TopicSlug, slugToTitle } from "@/lib/topics";

type Draft = {
  title: string; dek: string; bodyMarkdown: string; tags: string[];
  sources: Array<{ title: string; url: string; publisher?: string; date?: string }>;
  imageBase64?: string; image_prompt?: string;
};

function cx(...xs: Array<string | false | null | undefined>) { return xs.filter(Boolean).join(" "); }

export default function AdminPage() {
  const [health, setHealth] = useState<{ AI_GENERATE_URL: string | null } | null>(null);
  const [topic, setTopic] = useState<TopicSlug>("in-the-news");
  const [minutes, setMinutes] = useState(5);
  const [brief, setBrief] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [published, setPublished] = useState<{ slug: string; path: string } | null>(null);

  useEffect(() => {
    fetch("/api/health/ai", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setHealth({ AI_GENERATE_URL: j.AI_GENERATE_URL }))
      .catch(() => setHealth({ AI_GENERATE_URL: null }));
  }, []);

  async function generateDraft() {
    setErr(null); setBusy(true); setPublished(null);
    try {
      const res = await fetch("/api/generate-article", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, prompt: brief, minutes })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDraft({
        title: data.title, dek: data.dek || "", bodyMarkdown: data.bodyMarkdown || "",
        tags: Array.isArray(data.tags) ? data.tags : [], sources: data.sources || [],
        image_prompt: data.image_prompt
      });
    } catch (e: any) {
      setErr(e?.message || "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function generateImage() {
    if (!draft?.image_prompt && !draft?.title) return;
    setErr(null); setBusy(true);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: draft?.image_prompt || `Editorial illustration: ${draft?.title}` })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDraft({ ...draft!, imageBase64: `data:image/jpeg;base64,${data.base64}` });
    } catch (e: any) {
      setErr(e?.message || "Image generation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!draft) return;
    setErr(null); setBusy(true);
    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: draft.title, dek: draft.dek, topicSlug: topic, tags: draft.tags,
          bodyMarkdown: draft.bodyMarkdown, sources: draft.sources, imageBase64: draft.imageBase64
        })
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
    <main className="max-w-[1100px] mx-auto my-8 px-4 space-y-6">
      {/* Health banner */}
      {health && !health.AI_GENERATE_URL && (
        <div className="border border-red-200 bg-red-50 text-red-800 rounded-xl p-3 text-sm">
          <b>AI generator not configured.</b> Set <code>AI_GENERATE_URL</code> in <code>.env.local</code> (http/https) and restart dev.
          <div className="mt-1">Example: <code>AI_GENERATE_URL=http://localhost:8000/generate</code></div>
        </div>
      )}

      <section className="border border-neutral-200 rounded-2xl p-6 bg-neutral-50">
        <h1 className="m-0 text-2xl font-semibold">Admin — Generate & Publish Article</h1>
        <p className="m-0 mt-2 text-neutral-700">Pick a topic, describe the article, generate a draft with sources, add an image, and publish.</p>
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
              {TOPICS.filter(t => t.slug !== "trending").map((t) => (
                <option key={t.slug} value={t.slug}>{slugToTitle(t.slug)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Target length (minutes)</label>
            <input type="range" min={3} max={10} value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value))} className="mt-3 w-full" />
            <div className="text-xs text-neutral-600 mt-1">{minutes} min read</div>
          </div>
          <div className="md:col-span-1 flex items-end">
            <button
              onClick={generateDraft}
              disabled={busy || !brief.trim()}
              className={cx("px-4 py-2 rounded-lg bg-black text-white hover:opacity-90", (!brief.trim() || busy) && "opacity-60")}
            >
              {busy ? "Working…" : "Generate Draft"}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Brief for AI</label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g., Summarize the new IRS guidance on HDHP preventive care and its impact on HSA eligibility."
            className="mt-1 w-full h-28 rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{err}</div>}
      </section>

      {draft && (
        <section className="border border-neutral-200 rounded-2xl p-6 space-y-4">
          {/* ... keep the rest of your draft editor, image generator, and publish button ... */}
          <div className="flex items-center justify-between">
            <button onClick={publish} disabled={busy} className={cx("px-4 py-2 rounded-lg bg-black text-white hover:opacity-90", busy && "opacity-60")}>
              {busy ? "Publishing…" : "Publish to Site"}
            </button>
            {published && (
              <div className="text-sm">
                Published: <Link href={published.path} className="underline underline-offset-4 hover:opacity-80">{published.path}</Link>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}