/** Only same-origin relative paths. Blocks //evil.com and protocol-relative URLs. */
export function safeInternalPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value) return fallback;
  const path = value.trim();
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//") || path.startsWith("/\\")) return fallback;
  if (path.includes("://") || path.includes("\\")) return fallback;
  return path;
}
