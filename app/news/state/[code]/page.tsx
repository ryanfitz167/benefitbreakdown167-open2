import Header from "@/components/Header";

export default function StateNews({ params }: { params: { code: string } }) {
  const code = params.code?.toUpperCase();
  return (
    <>
      <Header />
      <main className="container py-12">
        <h1 className="h1">In the News — {code}</h1>
        <p className="muted mt-2">State-specific updates and headlines.</p>

        {/* Replace with your dynamic list */}
        <div className="mt-8 border rounded-lg p-6">
          No articles yet for {code}. Come back soon.
        </div>
      </main>
    </>
  );
}
