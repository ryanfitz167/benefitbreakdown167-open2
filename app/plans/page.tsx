// app/page.tsx
import Link from "next/link";
import NewsletterSection from "@/components/NewsletterSection";
import TodayLabel from "@/components/TodayLabel";

// Replace with your real data source later
type Article = { title: string; href: string; source?: string; date?: string };

const articles: Article[] = [
  { title: "IRS Releases 2026 ACA Affordability Safe Harbor", href: "/news/irs-aca-affordability-2026", source: "IRS", date: "2025-08-29" },
  { title: "HHS Proposes Changes to HIPAA Notice of Privacy Practices", href: "/news/hhs-hipaa-npp-update", source: "HHS", date: "2025-08-28" },
  { title: "COBRA Guidance Clarifies Second Qualifying Events", href: "/news/cobra-second-qualifying-events", source: "DOL", date: "2025-08-27" },
  { title: "PCORI Fee Indexed for Plan Years Ending Oct 2026", href: "/news/pcori-fee-2026", source: "IRS", date: "2025-08-26" },
  { title: "KFF: Employer Premiums Up 7% Year-over-Year", href: "/news/kff-employer-premiums", source: "KFF", date: "2025-08-26" },
  { title: "New Preventive Care Coverage Clarifications", href: "/news/preventive-care-clarifications", source: "USPSTF", date: "2025-08-25" },
  { title: "Cost Sharing Limits: 2026 OOP Max Announced", href: "/news/oop-max-2026", source: "HHS", date: "2025-08-25" },
  { title: "MHPAEA Comparative Analysis Enforcement Trends", href: "/news/mhpaea-enforcement-2025", source: "DOL", date: "2025-08-24" },
  { title: "HDHP/HSA Limits Recap for 2026 Plan Years", href: "/news/hsa-limits-2026", source: "IRS", date: "2025-08-24" },
  { title: "Marketplace Special Enrollment Periods: New FAQ", href: "/news/marketplace-sep-faq", source: "CMS", date: "2025-08-23" },
];

export default function Home() {
  const latest = articles.slice(0, 10);

  return (
    <>
      {/* HERO */}
      <section className="border-b">
        <div className="container py-12 md:py-16">
          <h1 className="h1">Benefit Breakdown</h1>
          <p className="mt-2 text-lg leading-relaxed muted max-w-3xl">
            Fast, plain-English coverage of health insurance & employee benefits.
            Readable updates so you can decide with confidence.
          </p>

          {/* ✅ client-only date to avoid hydration mismatch */}
          <p className="mt-3 text-sm muted">
            <TodayLabel />
          </p>

          {/* Category pills */}
          <div className="mt-6 flex w-full flex-wrap gap-2">
            <Category href="/news">In the News</Category>
            <Category href="/compliance">Compliance & Regulations</Category>
            <Category href="/plans">Plan Types & Coverage</Category>
            <Category href="/employer">Employer Playbooks</Category>
            <Category href="/how-to">Using Your Benefits</Category>
            <Category href="/claims">Claims, Bills & Appeals</Category>
            <Category href="/medicare">Medicare & Medicaid</Category>
          </div>
        </div>
      </section>

      {/* LATEST 10 */}
      <section>
        <div className="container py-6 md:py-8">
          <ol className="space-y-3">
            {latest.map((a, i) => (
              <li key={a.href} className="border-b pb-3 last:border-none">
                <Link
                  href={a.href}
                  className="block text-lg font-semibold hover:text-blue-700 hover:underline"
                >
                  {i + 1}. {a.title}
                </Link>
                {(a.source || a.date) && (
                  <div className="mt-1 text-xs muted">
                    {a.source ? <span>{a.source}</span> : null}
                    {a.source && a.date ? <span> · </span> : null}
                    {/* Use the ISO string directly for hydration-safe output */}
                    {a.date ? <time dateTime={a.date}>{a.date}</time> : null}
                  </div>
                )}
              </li>
            ))}
          </ol>

          <div className="mt-6">
            <Link href="/news" className="text-blue-600 hover:underline">
              See all news →
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter at the bottom */}
      <NewsletterSection />
    </>
  );
}

function Category({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full border bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm hover:border-blue-600 hover:text-blue-700"
    >
      {children}
    </Link>
  );
}
