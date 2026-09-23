/**
 * Runtime detection without Cloudflare-specific APIs.
 * Used only for connection/caching policy (Workers are isolate-scoped).
 */
export function isCloudflareRuntime() {
  return (
    process.env.CF_PAGES === "1" ||
    process.env.CF_PAGES === "true" ||
    (typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers")
  );
}

/** True while `next build` / OpenNext is compiling (no live DB). */
export function isNextProductionBuild() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

const PRODUCTION_SITE = "https://arkasalehi.com";

export function isLoopbackOrigin(value: string) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host.endsWith(".localhost");
  } catch {
    return /localhost|127\.0\.0\.1/i.test(value);
  }
}

export function publicOriginFromHost(host: string | null | undefined) {
  const h = (host || "").split(":")[0]?.toLowerCase() ?? "";
  if (!h || h === "localhost" || h === "127.0.0.1" || h === "[::1]") return "";
  if (h.endsWith(".workers.dev") || h.endsWith(".pages.dev")) return `https://${h}`;
  const apex = h.startsWith("workspace.") ? h.slice("workspace.".length) : h;
  return `https://${apex}`;
}

export function publicSiteUrl(host?: string | null) {
  const configured = (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  if (configured && !isLoopbackOrigin(configured)) return configured;
  const derived = publicOriginFromHost(host ?? (typeof window !== "undefined" ? window.location.host : ""));
  if (derived) return derived;
  if (process.env.NODE_ENV === "production") return PRODUCTION_SITE;
  return configured || "http://localhost:3000";
}

export function workspaceUrl() {
  const configured = (process.env.NEXT_PUBLIC_WORKSPACE_URL || "").replace(/\/$/, "");
  if (configured && !isLoopbackOrigin(configured)) return configured;
  return "https://workspace.arkasalehi.com";
}

export function isWorkspaceHost(host: string | null | undefined) {
  const h = (host || "").split(":")[0]?.toLowerCase() ?? "";
  return h === "workspace.arkasalehi.com" || h.startsWith("workspace.");
}

export function isPublicAuthPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/update-password" ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/register/")
  );
}
