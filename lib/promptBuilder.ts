// lib/promptBuilder.ts

import fs from "fs";
import path from "path";

export function buildPrompt({
  topic,
  sources = [],
  notes = "",
}: {
  topic: string;
  sources?: string[];
  notes?: string;
}): string {
  const file = path.join(process.cwd(), "data", "sources.json");
  let externalSources: string[] = [];

  try {
    const raw = fs.readFileSync(file, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      externalSources = parsed.map((s: any) => s.content).filter(Boolean);
    }
  } catch (err) {
    console.error("Failed to read external sources:", err);
  }

  const sourceText = [
    ...sources,
    ...externalSources,
  ].length
    ? `Use the following sources:
${[...sources, ...externalSources].map((s, i) => `${i + 1}. ${s}`).join("\n")}`
    : "";

  return `
You are a specialized assistant who only answers questions related to employee benefits, health insurance, Medicare, Medicaid, compliance, and related HR benefit topics.

If a question is off-topic (e.g. about the weather, history, or celebrities), respond with: "I'm here to help with health insurance and benefits questions."

If you cannot find an answer or are unsure, say: "I do not know this information at this time."

When responding to questions or writing articles:
- Prioritize the provided sources for up-to-date, specific insights.
- If nothing is found in the sources, rely on your own internal healthcare benefits knowledge.

Write a detailed and informative article on the topic: "${topic}"

The article should follow this structure:

1. **Introduction** – Briefly introduce the topic and its relevance.
2. **Summary** – Provide a brief bullet-point summary of key insights.
3. **Body Paragraphs** – Elaborate on main points with clear subheadings.
4. **Conclusion** – Wrap up with final thoughts.
5. **Citations** – List citations where appropriate (can be mocked if needed).
6. **Disclaimer** – Include: "Nothing in this article should be construed as legal or tax advice."

${sourceText ? `\n${sourceText}` : ""}

${notes ? `\nAdditional Notes:\n${notes}` : ""}

Write in a human tone, suitable for employees or HR professionals trying to understand benefits.`.trim();
}
