"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const TOPICS = ["medicare", "hsa", "ppo", "hmo", "deductibles", "telehealth"]; // edit to match your taxonomy

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur border-b border-neutral-200">
      <div className="container-1440 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight text-lg">Benefit Breakdown</Link>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          {TOPICS.map((t) => {
            const href = `/topics/${t}`;
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={t}
                href={href}
                className={`px-2 py-1 rounded ${active ? "bg-neutral-100" : "hover:bg-neutral-100"}`}
              >
                {t.toUpperCase()}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

