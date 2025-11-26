import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-200">
      <div className="max-w-[1100px] mx-auto px-4 py-6 flex items-center justify-between">
        <span className="text-sm text-neutral-500">© {new Date().getFullYear()} Benefit Breakdown</span>
        <nav className="flex gap-4 text-sm">
          <Link href="/about" className="hover:opacity-80">About Us</Link>
          <Link href="/contact" className="hover:opacity-80">Contact Us</Link>
        </nav>
      </div>
    </footer>
  );
}