// FILE: types/rehype.d.ts
// Why: these packages ship without TS types; this silences editor complaints.
declare module "rehype-slug" {
  const plugin: any;
  export default plugin;
}
declare module "rehype-autolink-headings" {
  const plugin: any;
  export default plugin;
}
