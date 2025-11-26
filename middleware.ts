// FILE: middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* Canonicalization + redirects + optional API throttle (Edge-safe) */

const legacySlugMap: Record<string, string> = {
  "trending-2025-health-benefits-watchlist": "trending-2025-watchlist",
  "deductible-vs-oop-plain-english": "deductible-vs-oop",
};

// helpers
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

function stripTrackingParams(u: URL): boolean {
  const before = u.search;
  const rm = new Set<string>();
  for (const key of u.searchParams.keys()) if (key.toLowerCase().startsWith("utm_")) rm.add(key);
  ["fbclid", "gclid", "msclkid"].forEach((k) => u.searchParams.has(k) && rm.add(k));
  rm.forEach((k) => u.searchParams.delete(k));
  return before !== u.search;
}

const removeTrailingSlash = (p: string) => (p === "/" ? p : p.replace(/\/+$/, ""));
const lowerPathSegments = (p: string) =>
  p
    .split("/")
    .map((seg, i) => (i === 0 ? seg : seg.toLowerCase()))
    .join("/");

// optional best-effort throttle (Edge runtime: per instance)
const HITS = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 30_000;
const MAX_REQS = 10;

function throttle(req: NextRequest): NextResponse | null {
  // guard header parsing to avoid undefined
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const rec = HITS.get(ip) ?? { count: 0, ts: now };
  if (now - rec.ts > WINDOW_MS) {
    rec.count = 0;
    rec.ts = now;
  }
  rec.count++;
  HITS.set(ip, rec);
  if (rec.count > MAX_REQS) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  return null;
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // (0) throttle
  if (pathname.startsWith("/api/")) {
    const limited = throttle(req);
    if (limited) return limited;
    return NextResponse.next();
  }

  // (1) strip tracking params
  {
    const cleaned = new URL(url.href);
    if (stripTrackingParams(cleaned)) return NextResponse.redirect(cleaned, 308);
  }

  // (2) lowercase segments for specific bases
  if (/^\/(blog|articles|category)(\/|$)/i.test(pathname)) {
    const lowercased = lowerPathSegments(pathname);
    if (lowercased !== pathname) {
      const next = new URL(url.href);
      next.pathname = removeTrailingSlash(lowercased);
      return NextResponse.redirect(next, 308);
    }
  }

  // (3) /blog/<legacy> → /blog/<canonical>
  {
    const m = pathname.match(/^\/blog\/(?<slug>[^/]+)$/);
    const incoming = m?.groups?.slug;
    if (incoming) {
      const canonical = legacySlugMap[incoming];
      if (canonical && canonical !== incoming) {
        const next = new URL(url.href);
        next.pathname = `/blog/${canonical}`;
        return NextResponse.redirect(next, 308);
      }
    }
  }

  // (4) /articles/<slug> → rewrite to /blog/<slug>
  {
    const m = pathname.match(/^\/articles\/(?<slug>[^/]+)$/);
    const incoming = m?.groups?.slug;
    if (incoming) {
      const canonical = legacySlugMap[incoming] ?? incoming;
      const next = new URL(url.href);
      next.pathname = `/blog/${canonical}`;
      return NextResponse.rewrite(next);
    }
  }

  // (5) /category/... → kebab-case + strip trailing slash
  if (pathname.startsWith("/category/")) {
    const m = pathname.match(/^\/category\/(?<cat>[^/]+)(?:\/(?<sub>[^/]+))?(?:\/(?<rest>.+))?$/);
    const cat = m?.groups?.cat;
    if (cat) {
      const normCat = slugify(cat);
      const normSub = m?.groups?.sub ? slugify(m.groups.sub) : undefined;
      const rest = m?.groups?.rest ?? "";

      const expected = normSub ? `/category/${normCat}/${normSub}/${rest}` : `/category/${normCat}/${rest}`;
      const normalized = removeTrailingSlash(expected.replace(/\/+$/, ""));
      if (pathname !== normalized) {
        const next = new URL(url.href);
        next.pathname = normalized;
        return NextResponse.redirect(next, 308);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/articles/:path*", "/category/:path*", "/blog/:path*", "/api/:path*"],
};




