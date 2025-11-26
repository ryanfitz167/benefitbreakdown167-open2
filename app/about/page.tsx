// FILE: app/about/page.tsx
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us · Benefit Breakdown",
  description:
    "Benefit Breakdown makes health insurance understandable. Plain-English explainers, definitions, compliance notes, and practical guides.",
};

export default function AboutPage() {
  return (
    <main className="max-w-[1100px] mx-auto px-4 my-10 space-y-10">
      {/* Hero */}
      <section className="border border-neutral-200 rounded-2xl p-8 bg-neutral-50">
        <h1 className="m-0 text-3xl font-semibold">About Benefit Breakdown</h1>
        <p className="mt-3 text-neutral-700 text-[15px] leading-relaxed">
          Health insurance is complex—and it changes constantly. Benefit Breakdown exists to make it
          clear, current, and useful. We translate plan jargon, regulatory shifts, and real-world
          scenarios into practical guidance for everyone: everyday individuals, HR and benefits
          teams, and small business owners.
        </p>
      </section>

      {/* Mission + Audience */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="border border-neutral-200 rounded-2xl p-6">
          <h2 className="text-xl font-semibold m-0">Our mission</h2>
          <p className="mt-2 text-neutral-700">
            Empower better health and financial decisions by explaining benefits in plain English,
            backed by timely updates and credible sources.
          </p>
          <ul className="mt-3 text-neutral-700 list-disc pl-5 space-y-1">
            <li>Explain what plans actually cover and what they cost.</li>
            <li>Highlight important deadlines, notices, and compliance items.</li>
            <li>Decode terms and acronyms so you can act with confidence.</li>
          </ul>
        </div>
        <div className="border border-neutral-200 rounded-2xl p-6">
          <h2 className="text-xl font-semibold m-0">Who it’s for</h2>
          <ul className="mt-3 text-neutral-700 list-disc pl-5 space-y-1">
            <li>Individuals comparing plans or untangling bills.</li>
            <li>HR/benefits admins who need clear, shareable explanations.</li>
            <li>Managers and small businesses making plan decisions.</li>
          </ul>
          <p className="mt-3 text-neutral-700">
            If benefits ever felt opaque, you’re in the right place.
          </p>
        </div>
      </section>

      {/* What you'll find */}
      <section className="border border-neutral-200 rounded-2xl p-6">
        <h2 className="text-xl font-semibold m-0">What you’ll find</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {[
            { href: "/topics/trending", title: "Trending", blurb: "Most viewed across the site." },
            { href: "/topics/in-the-news", title: "In the News", blurb: "Benefits in current headlines." },
            { href: "/topics/compliance", title: "Compliance", blurb: "Rules, deadlines, notices." },
            { href: "/topics/definitions", title: "Definitions", blurb: "Jargon, explained simply." },
            { href: "/topics/future", title: "Future", blurb: "What’s changing next." },
            { href: "/topics/flyers-and-guides", title: "Flyers & Guides", blurb: "Downloadables & walkthroughs." },
          ].map((t) => (
            <Link key={t.href} href={t.href} className="no-underline">
              <article className="border border-neutral-200 rounded-xl p-4 bg-white hover:opacity-90">
                <h3 className="m-0 text-[16px] font-semibold">{t.title}</h3>
                <p className="m-0 mt-1 text-sm text-neutral-700">{t.blurb}</p>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* How we work */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="border border-neutral-200 rounded-2xl p-6">
          <h3 className="m-0 text-lg font-semibold">Plain-English first</h3>
          <p className="mt-2 text-neutral-700">
            We prioritize clarity over jargon. Every article aims to be scannable, practical, and
            immediately useful.
          </p>
        </div>
        <div className="border border-neutral-200 rounded-2xl p-6">
          <h3 className="m-0 text-lg font-semibold">Timely updates</h3>
          <p className="mt-2 text-neutral-700">
            Policies evolve. We revisit high-traffic and regulatory pages, updating when changes
            affect readers.
          </p>
        </div>
        <div className="border border-neutral-200 rounded-2xl p-6">
          <h3 className="m-0 text-lg font-semibold">Balanced coverage</h3>
          <p className="mt-2 text-neutral-700">
            We note trade-offs and edge cases. When rules vary by carrier or state, we say so and
            point to next steps.
          </p>
        </div>
      </section>

      {/* CTAs */}
      <section className="border border-neutral-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="m-0 text-lg font-semibold">Have a question?</h3>
          <p className="m-0 mt-1 text-neutral-700">
            Try our Ask AI tool or send us a note—we’re here to help.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/ask-ai" className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90">
            Ask AI
          </Link>
          <Link href="/contact" className="px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50">
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}