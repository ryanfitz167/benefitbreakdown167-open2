export function getSiteUrl() {
  // Set this in prod (e.g., on Vercel) to your real domain:
  // NEXT_PUBLIC_SITE_URL=https://benefitbreakdown.com
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) return env.replace(/\/+$/, "");
  return "http://localhost:3000";
}
