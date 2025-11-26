/// <reference types="node" />
/// <reference types="tailwindcss" />

// Some editors still complain about slugify — this shim quiets it everywhere.
declare module "slugify" {
  export default function slugify(
    input: string,
    options?: {
      replacement?: string;
      remove?: RegExp;
      lower?: boolean;
      strict?: boolean;
      locale?: string;
      trim?: boolean;
    }
  ): string;
}
