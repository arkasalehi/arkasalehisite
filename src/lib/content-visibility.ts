/** Dashboard test rows stay in the database; public lists and the sitemap skip them. */
export function isTestContent(input: { slug?: string | null; title?: string | null }) {
  const slug = (input.slug ?? "").trim().toLowerCase();
  const title = (input.title ?? "").trim();
  if (slug === "test" || slug === "تست" || slug.startsWith("demo-") || slug.startsWith("test-")) return true;
  if (title === "تست" || title.toLowerCase() === "test" || title.startsWith("کارت تست")) return true;
  return false;
}
