// FILE: app/contact/page.tsx
import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us · Benefit Breakdown",
  description: "Get in touch with Benefit Breakdown: questions, feedback, partnerships, or press.",
};

export default function ContactPage() {
  return (
    <main className="max-w-[1100px] mx-auto px-4 my-10 space-y-10">
      {/* Hero */}
      <section className="border border-neutral-200 rounded-2xl p-8 bg-neutral-50">
        <h1 className="m-0 text-3xl font-semibold">Contact Benefit Breakdown</h1>
        <p className="mt-3 text-neutral-700 text-[15px] leading-relaxed">
          We’d love to hear from you. For any questions, suggestions, or corrections, reach us at{" "}
          <a href="mailto:benefitbreakdownhelp@gmail.com" className="underline underline-offset-4">
            benefitbreakdownhelp@gmail.com
          </a>
          .
        </p>
      </section>

      {/* Contact options */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="border border-neutral-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold m-0">General & feedback</h2>
          <p className="mt-2 text-neutral-700">
            Questions about an article or idea for a new topic? Send a note and we’ll get back to you.
          </p>
          <a href="mailto:benefitbreakdownhelp@gmail.com" className="px-3 py-2 inline-block rounded-lg border border-neutral-300 hover:bg-neutral-50">
            Email us
          </a>
        </div>
        <div className="border border-neutral-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold m-0">Partnerships</h2>
          <p className="mt-2 text-neutral-700">
            Interested in collaborating or licensing content? We’re open to partnerships that help people navigate benefits.
          </p>
          <a href="mailto:benefitbreakdownhelp@gmail.com?subject=Partnership%20Inquiry" className="px-3 py-2 inline-block rounded-lg border border-neutral-300 hover:bg-neutral-50">
            Partnership inquiry
          </a>
        </div>
        <div className="border border-neutral-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold m-0">Corrections</h2>
          <p className="mt-2 text-neutral-700">
            Spot an error or out-of-date detail? Tell us where you saw it so we can fix it quickly.
          </p>
          <a href="mailto:benefitbreakdownhelp@gmail.com?subject=Content%20Correction" className="px-3 py-2 inline-block rounded-lg border border-neutral-300 hover:bg-neutral-50">
            Send a correction
          </a>
        </div>
      </section>

      {/* Form */}
      <section className="border border-neutral-200 rounded-2xl p-6">
        <h2 className="text-xl font-semibold m-0">Send us a message</h2>
        <p className="mt-2 text-neutral-700">
          Fill out the form below. Your email client will open with your message pre-filled.
        </p>
        <div className="mt-4">
          <ContactForm />
        </div>
      </section>

      {/* Additional links */}
      <section className="border border-neutral-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="m-0 text-lg font-semibold">Looking for something specific?</h3>
          <p className="m-0 mt-1 text-neutral-700">
            Browse topics or ask a question and we’ll guide you.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/topics/trending" className="px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50">
            Explore topics
          </Link>
          <Link href="/ask-ai" className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90">
            Ask AI
          </Link>
        </div>
      </section>
    </main>
  );
}