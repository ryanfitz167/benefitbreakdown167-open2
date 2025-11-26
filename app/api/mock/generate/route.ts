import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({
    title: "Open Enrollment 2025: What’s New",
    dek: "Key updates and how to prepare for selection season.",
    bodyMarkdown: `**What changed**
- Premiums and contribution limits adjusted. [1]
- Preventive care clarifications for HDHPs. [2]

**What this means for you**
- Compare total cost, not just premiums.
- Confirm in-network doctors and recurring meds.

**How to decide**
- List likely care and estimate costs under two plans.
- Check employer HSA/HRA contributions if offered.

Keep EOBs, watch mid-year notices, and update PCPs after enrollment. [1][2]`,
    tags: ["Open Enrollment", "Compliance"],
    image_prompt:
      "clean abstract editorial illustration of health benefits, forms, and checklists; no logos; flat vector",
    sources: [
      { title: "CMS Fact Sheet", url: "https://www.cms.gov/", publisher: "CMS", date: "2025-09-15" },
      { title: "IRS Guidance", url: "https://www.irs.gov/", publisher: "IRS", date: "2025-09-20" }
    ]
  });
}

