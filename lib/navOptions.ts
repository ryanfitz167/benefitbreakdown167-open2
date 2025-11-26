// lib/navOptions.ts
export const CATEGORY_OPTIONS = [
  { value: "in-the-news", label: "In the News" },
  { value: "compliance", label: "Compliance" },
  { value: "definitions", label: "Definitions" },
  { value: "guides", label: "Guides" },
  { value: "employee-benefits", label: "Employee Benefits" },
];

// All values are URL-safe slugs.
// These do NOT need to match the exact folder names—publishing will map
// slugs to your existing folders automatically (case/punctuation tolerant).
export const SUBTOPIC_OPTIONS: Record<string, string[]> = {
  "in-the-news": [
    "courts-regs",
    "healthcare",
    "hipaa",
    "markets",
    "medicare",
    "state-updates",
  ],
  compliance: ["aca", "hipaa", "cobra", "erisa", "pcori", "cafeteria-plans"],
  definitions: [
    "accounts",
    "costs",
    "eligibility",
    "health-plan-terms",
    "networks",
    "pharmacy",
  ],
  guides: [
    "choosing-a-plan",
    "cobra-basics",
    "fsas",
    "hsa-hras",
    "medicare-101",
    "open-enrollment",
  ],
  "employee-benefits": [],
};

export function toTitle(s: string) {
  return (s || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

