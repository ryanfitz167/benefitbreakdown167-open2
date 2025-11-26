// app/news/[slug]/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Article not found</h1>
        <p className="mt-2 text-slate-700">The article you’re looking for may have moved or been removed.</p>
        <div className="mt-6">
          <Link href="/news" className="text-blue-700 font-medium hover:underline">
            ← Back to In the News
          </Link>
        </div>
      </div>
    </div>
  );
}
