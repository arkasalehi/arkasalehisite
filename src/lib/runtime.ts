/**
 * Runtime detection without Cloudflare-specific APIs.
 * Used only for connection/caching policy (Workers are isolate-scoped).
 */
export function isCloudflareRuntime() {
  return (
    process.env.CF_PAGES === "1" ||
    process.env.CF_PAGES === "true" ||
    typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers"
  );
}

export function isAccelerateUrl(url = process.env.PRISMA_ACCELERATE_URL || process.env.DATABASE_URL || "") {
  return url.startsWith("prisma://") || url.startsWith("prisma+postgres://");
}

export function publicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
