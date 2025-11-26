// app/chat/layout.tsx
export default function ChatLayout({ children }: { children: React.ReactNode }) {
  // Pass-through layout so /chat does NOT add its own header/footer.
  // The root app/layout.tsx already includes the global Header and Footer.
  return <>{children}</>;
}
