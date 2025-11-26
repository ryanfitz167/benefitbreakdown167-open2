import Image from "next/image";
import TOC from "@/components/TOC";
import AdSlot from "@/components/AdSlot";

export default function ArticleLayout({
  title,
  date,
  readTime,
  heroImage,
  children,
}: {
  title: string;
  date: string;
  readTime: string;
  heroImage?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* header */}
      <header className="mb-6 border-b pb-4">
        <div className="text-sm text-neutral-500">{date} • {readTime}</div>
        <h1 className="mt-2 text-3xl/tight font-extrabold tracking-tight">{title}</h1>
      </header>

      {/* hero + top ad */}
      {heroImage ? (
        <div className="mb-6">
          <Image
            src={heroImage}
            alt=""
            width={1400}
            height={700}
            className="rounded-2xl w-full h-auto"
            priority
          />
        </div>
      ) : (
        <div className="mb-6">
          <AdSlot outlineOnly label="Top Banner" className="h-28" />
        </div>
      )}

      {/* 3-column layout (rail / content / rail) */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_260px] gap-8">
        {/* left rail (TOC) */}
        <aside className="hidden lg:block">
          <TOC />
        </aside>

        {/* main content */}
        <main id="article-content" className="prose prose-neutral max-w-none">
          {/* inline ad near intro */}
          <AdSlot outlineOnly label="Inline Ad A" className="my-6 h-24" />
          {children}
          {/* mid-article ad */}
          <AdSlot outlineOnly label="Inline Ad B" className="my-8 h-28" />
        </main>

        {/* right rail (ads / “more to read”) */}
        <aside className="hidden lg:block">
          <div className="space-y-6">
            <AdSlot outlineOnly label="Right Rail A" className="h-64" />
            <AdSlot outlineOnly label="Right Rail B" className="h-64" />
          </div>
        </aside>
      </div>
    </div>
  );
}
