import slugify from "slugify";

export const toSlug = (s: string) =>
  slugify(String(s || ""), { lower: true, strict: true });

const ACRONYMS = new Set(["ACA","HIPAA","HSA","HRA","FSA","PCORI","ERISA","COBRA","CMS","HMO","PPO","EPO","HDHP","OOP"]);
export const titleCaseFromSlug = (slug: string) =>
  String(slug || "")
    .split("-")
    .map(w => (ACRONYMS.has(w.toUpperCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join("-");
