export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl py-24 text-center">
      <h1 className="text-3xl font-extrabold">Article not found</h1>
      <p className="mt-2 text-neutral-600">Check the URL or return to <a className="text-blue-600 underline" href="/articles">All Articles</a>.</p>
    </div>
  );
}
