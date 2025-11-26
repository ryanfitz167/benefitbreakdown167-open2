// lib/news.ts
export type Article = {
  slug: string;
  title: string;
  date: string;     // ISO (YYYY-MM-DD)
  source?: string;
  summary?: string;
  body: string[];   // paragraphs
  tags?: string[];
};

export const ARTICLES: Article[] = [
  {
    slug: "irs-aca-affordability-2026",
    title: "IRS Releases 2026 ACA Affordability Safe Harbor",
    date: "2025-08-29",
    source: "IRS",
    summary:
      "The IRS published the ACA affordability percentage for 2026, impacting employer shared responsibility calculations and safe harbor thresholds.",
    body: [
      "The IRS announced the 2026 affordability percentage used to determine whether employer coverage is considered affordable under the ACA. This percentage influences the ‘affordability safe harbors’ employers use for 4980H(b) penalty exposure.",
      "Employers should review their contribution strategies for 2026 open enrollment and coordinate with payroll to ensure measurement and offer rules stay aligned with the new threshold.",
    ],
    tags: ["ACA", "Affordability", "Employers"],
  },
  {
    slug: "hhs-hipaa-npp-update",
    title: "HHS Proposes Changes to HIPAA Notice of Privacy Practices",
    date: "2025-08-28",
    source: "HHS",
    summary:
      "Proposed updates would modernize HIPAA NPP requirements and clarify certain patient rights in light of recent guidance.",
    body: [
      "HHS proposed revisions to the HIPAA Notice of Privacy Practices (NPP) to better explain patients’ rights and how protected health information is used and disclosed.",
      "Plan sponsors should follow the rulemaking process and be ready to refresh their NPP templates and distribution processes if finalized.",
    ],
    tags: ["HIPAA", "NPP", "Compliance"],
  },
  {
    slug: "cobra-second-qualifying-events",
    title: "COBRA Guidance Clarifies Second Qualifying Events",
    date: "2025-08-27",
    source: "DOL",
    summary:
      "New guidance outlines how second qualifying events can extend COBRA continuation and what notices must be provided.",
    body: [
      "The DOL released guidance on how a second qualifying event interacts with initial COBRA eligibility and timelines.",
      "Employers should check their COBRA vendor processes for notices, timing, and documentation to ensure consistent administration.",
    ],
    tags: ["COBRA", "Notices", "Compliance"],
  },
  {
    slug: "pcori-fee-2026",
    title: "PCORI Fee Indexed for Plan Years Ending Oct 2026",
    date: "2025-08-26",
    source: "IRS",
    summary:
      "The PCORI research fee was indexed for plan years ending in October 2026; self-funded plan sponsors should budget and calendar deadlines.",
    body: [
      "The IRS published the PCORI fee for plan years ending in October 2026.",
      "Self-funded plan sponsors should update calendars for Form 720 filing and coordinate with TPAs to confirm covered lives counts.",
    ],
    tags: ["PCORI", "IRS", "Self-funded"],
  },
  {
    slug: "kff-employer-premiums",
    title: "KFF: Employer Premiums Up 7% Year-over-Year",
    date: "2025-08-26",
    source: "KFF",
    summary:
      "New research indicates a 7% YoY increase in average employer-sponsored premiums with variation by plan type and region.",
    body: [
      "KFF’s latest employer survey points to premium increases across multiple plan types.",
      "Finance and HR should incorporate utilization and trend assumptions into renewal discussions and employee contribution planning.",
    ],
    tags: ["Costs", "Premiums", "Research"],
  },
  {
    slug: "preventive-care-clarifications",
    title: "New Preventive Care Coverage Clarifications",
    date: "2025-08-25",
    source: "USPSTF",
    summary:
      "Clarifications address certain preventive care coverage nuances under federal guidance.",
    body: [
      "Recent clarifications explain how certain screenings and immunizations should be covered under preventive services rules.",
      "Members should verify plan documents and talk to carriers for service-specific coverage nuances.",
    ],
    tags: ["Preventive Care", "Coverage"],
  },
  {
    slug: "oop-max-2026",
    title: "Cost Sharing Limits: 2026 OOP Max Announced",
    date: "2025-08-25",
    source: "HHS",
    summary:
      "HHS released proposed out-of-pocket maximums for 2026 non-grandfathered plans.",
    body: [
      "The proposed OOP maximums would set ceilings on in-network cost sharing for 2026.",
      "Employers should confirm plan designs fit within final limits and assess employee impact.",
    ],
    tags: ["Cost Sharing", "Limits", "HHS"],
  },
  {
    slug: "mhpaea-enforcement-2025",
    title: "MHPAEA Comparative Analysis Enforcement Trends",
    date: "2025-08-24",
    source: "DOL",
    summary:
      "DOL described current enforcement priorities for NQTL comparative analyses and plan documentation.",
    body: [
      "The agency highlighted areas of focus in reviewing plan NQTLs and documentation quality.",
      "Plan sponsors should revisit their comparative analyses and be ready to produce documentation on request.",
    ],
    tags: ["MHPAEA", "Parity", "Compliance"],
  },
  {
    slug: "hsa-limits-2026",
    title: "HDHP/HSA Limits Recap for 2026 Plan Years",
    date: "2025-08-24",
    source: "IRS",
    summary:
      "A recap of HSA contribution and HDHP minimums for the 2026 plan year.",
    body: [
      "The IRS previously released the 2026 HSA and HDHP parameters.",
      "Employees should plan contributions early and coordinate payroll elections during open enrollment.",
    ],
    tags: ["HSA", "HDHP", "Limits"],
  },
  {
    slug: "marketplace-sep-faq",
    title: "Marketplace Special Enrollment Periods: New FAQ",
    date: "2025-08-23",
    source: "CMS",
    summary:
      "New FAQ addresses Marketplace SEP scenarios and documentation expectations.",
    body: [
      "CMS added clarifications around certain SEP triggers and required documentation.",
      "Individuals should review timelines to avoid coverage gaps and maintain eligibility.",
    ],
    tags: ["Marketplace", "SEP", "CMS"],
  },
];

// Helpers
export function getAllArticles(): Article[] {
  // Already newest-first; ensure copy
  return [...ARTICLES];
}
export function getLatest(n = 10): Article[] {
  return ARTICLES.slice(0, n);
}
export function getArticleBySlug(slug: string): Article | null {
  return ARTICLES.find(a => a.slug === slug) || null;
}
export function getRelated(slug: string, n = 4): Article[] {
  const others = ARTICLES.filter(a => a.slug !== slug);
  return others.slice(0, n);
}
