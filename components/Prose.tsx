import "@/styles/prose.css";

export default function Prose({ children }: { children: React.ReactNode }) {
  return <div className="prose">{children}</div>;
}
