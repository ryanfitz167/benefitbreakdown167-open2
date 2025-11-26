import "./globals.css";
import type { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Benefit Breakdown",
  description: "Plain-English benefits explanations, compliance notes, definitions, and guides.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black antialiased">
        {/* If you have a header/nav, keep it here */}
        {children}
        <Footer />
      </body>
    </html>
  );
}