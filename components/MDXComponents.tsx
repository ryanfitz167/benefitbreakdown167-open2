"use client";
import { MDXProvider } from "@mdx-js/react";

const components = {
  a: (props: any) => <a {...props} target="_blank" rel="noopener noreferrer" />,
  // Add custom blocks if needed
};

export default function MDXComponents({ children }: { children: React.ReactNode }) {
  return <MDXProvider components={components}>{children}</MDXProvider>;
}
