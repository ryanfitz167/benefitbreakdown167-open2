// components/TodayLabel.tsx
"use client";

export default function TodayLabel() {
  const today = new Date();
  const label = today.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return <span>Updated {label}</span>;
}
