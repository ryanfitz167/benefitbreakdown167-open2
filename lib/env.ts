// lib/env.ts
export const ENV = {
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  NEWSLETTER_WEBHOOK_URL: process.env.NEWSLETTER_WEBHOOK_URL,
  BROKER_WEBHOOK_URL: process.env.BROKER_WEBHOOK_URL,
  OPTIN_WEBHOOK_URL: process.env.OPTIN_WEBHOOK_URL, // optional unified endpoint
};
