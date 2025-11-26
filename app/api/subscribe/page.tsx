import NewsletterOptIn from "@/components/forms/NewsletterOptIn";

export default function SubscribePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Subscribe</h1>
      <p className="text-neutral-600 mb-6">Plain-English benefits insights. No spam.</p>
      <NewsletterOptIn />
    </main>
  );
}
