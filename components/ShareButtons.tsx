"use client";

import { usePathname } from "next/navigation";

export default function ShareButtons() {
  const path = usePathname();
  const url = typeof window !== "undefined"
    ? `${window.location.origin}${path}`
    : path;

  return (
    <div className="mt-8">
      <p className="font-semibold mb-2">Share this article:</p>
      <div className="flex space-x-3">
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500"
        >
          Twitter/X
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700"
        >
          LinkedIn
        </a>
        <a
          href={`mailto:?subject=Check out this article&body=${encodeURIComponent(url)}`}
          className="text-green-600"
        >
          Email
        </a>
      </div>
    </div>
  );
}
