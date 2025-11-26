// components/SocialShare.tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const DOMAIN = "https://www.benefitbreakdown.com"; // change to your real domain

export default function SocialShare({ title }: { title: string }) {
  const pathname = usePathname();
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${DOMAIN}${pathname}`);
  }, [pathname]);

  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const links = [
    {
      name: "Twitter",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: "🐦",
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: "🔗",
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: "📘",
    },
    {
      name: "Email",
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      icon: "✉️",
    },
  ];

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-semibold mb-2">Share this article</h3>
      <div className="flex flex-wrap gap-3">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-sm font-medium"
          >
            <span>{link.icon}</span>
            {link.name}
          </a>
        ))}
      </div>
    </div>
  );
}
