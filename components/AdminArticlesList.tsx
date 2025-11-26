import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";

export default async function AdminArticlesList() {
  const root = path.join(process.cwd(), "public", "articles");
  const categoryMap: Record<string, string[]> = {
    "In the News": ["Policy Changes", "Industry Updates", "Health Trends"],
    Compliance: ["ACA", "COBRA", "HIPAA", "ERISA"],
    Definitions: ["Terms", "Jargon", "Acronyms"],
    "Employee Benefits": ["Dental", "Vision", "Life Insurance"],
    "Medicare & Medicaid": ["Part A", "Part B", "Medicaid Basics"],
    "Employer Playbooks": ["Cost Control", "Wellness Programs", "Benchmarking"],
  };

  async function getArticlesByPath(main: string, sub: string): Promise<{ title: string; filename: string }[]> {
    const folder = path.join(root, main, sub);
    try {
      const files = await fs.readdir(folder);
      return files.map((file) => ({
        title: file.replace(/\.mdx$/, ""),
        filename: file,
      }));
    } catch {
      return [];
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold mb-4">🗂️ Published Articles by Category</h2>
      <div className="space-y-8">
        {Object.entries(categoryMap).map(([main, subs]) => (
          <div key={main}>
            <h3 className="text-xl font-bold text-blue-700 mb-2">{main}</h3>
            {subs.map(async (sub) => {
              const articles = await getArticlesByPath(main, sub);
              return (
                <div key={sub} className="ml-4 mb-4">
                  <h4 className="font-medium text-gray-800 mb-1">{sub}</h4>
                  {articles.length === 0 ? (
                    <p className="text-sm text-slate-500">No articles yet.</p>
                  ) : (
                    <ul className="list-disc list-inside text-sm">
                      {articles.map((a) => (
                        <li key={a.filename}>
                          <span className="text-gray-700">{a.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
