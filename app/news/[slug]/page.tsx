// app/news/[slug]/page.tsx

import { notFound } from "next/navigation";

interface Props {
  params: {
    slug: string;
  };
}

// Example: simulate article fetching logic
const articles: { [key: string]: { title: string; body: string } } = {
  "gpt-health-benefits": {
    title: "How GPT is Revolutionizing Health Benefits",
    body: "AI tools like GPT-4o are streamlining how companies educate employees about their healthcare options, simplify benefit navigation, and personalize support.",
  },
  "employee-retention-tips": {
    title: "Top 5 Benefit Strategies to Retain Talent",
    body: "From mental health services to flexible plan design, HR teams are using innovative benefits to boost employee satisfaction and reduce turnover.",
  },
};

export default function ArticlePage({ params }: Props) {
  const article = articles[params.slug];

  if (!article) {
    notFound(); // Show 404 if slug is invalid
  }

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
      <p className="text-gray-700 text-lg leading-7">{article.body}</p>
    </main>
  );
}
