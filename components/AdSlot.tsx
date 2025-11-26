"use client";
import { useEffect, useId } from "react";

type Props = {
  slot?: string;
  format?: "rectangle" | "horizontal" | "vertical" | "fluid";
  className?: string;
  label?: string;            // shows “Ad” box when no AdSense id yet
  outlineOnly?: boolean;     // shows just an outlined box (dev)
};

export default function AdSlot({
  slot,
  format = "rectangle",
  className = "",
  label = "Ad",
  outlineOnly,
}: Props) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT; // e.g. ca-pub-xxxxxxxxxxxxxxx
  const id = useId();

  useEffect(() => {
    if (!client || outlineOnly) return;
    // load the AdSense script once
    const existing = document.querySelector<HTMLScriptElement>('script[data-adsbygoogle]');
    if (!existing) {
      const s = document.createElement("script");
      s.setAttribute("data-adsbygoogle", "true");
      s.async = true;
      s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + client;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    // push the ad
    // @ts-ignore
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }, [client, outlineOnly]);

  if (!client || outlineOnly) {
    return (
      <div
        className={`border border-dashed rounded-xl text-xs text-neutral-500 p-3 grid place-items-center ${className}`}
        aria-label={label}
      >
        <div className="opacity-80">{label} placeholder</div>
      </div>
    );
  }

  return (
    <ins
      key={id}
      className={`adsbygoogle block ${className}`}
      style={{ display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot ?? ""}
      data-ad-format={format === "fluid" ? "fluid" : "auto"}
      data-full-width-responsive="true"
      aria-label="Advertisement"
    />
  );
}
