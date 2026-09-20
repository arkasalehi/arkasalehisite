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

export function publicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function workspaceUrl() {
  return (process.env.NEXT_PUBLIC_WORKSPACE_URL || "https://workspace.arkasalehi.com").replace(/\/$/, "");
}

export function isWorkspaceHost(host: string | null | undefined) {
  const h = (host || "").split(":")[0]?.toLowerCase() ?? "";
  return h === "workspace.arkasalehi.com" || h.startsWith("workspace.");
}
