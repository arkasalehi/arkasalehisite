import type { CookieOptions } from "@supabase/ssr";

function cookieDomainForHost(host?: string) {
  const explicit = process.env.COOKIE_DOMAIN?.trim();
  if (explicit) return explicit;
  const h = (host || "").split(":")[0]?.toLowerCase() ?? "";
  if (h === "arkasalehi.com" || h.endsWith(".arkasalehi.com")) return ".arkasalehi.com";
  return undefined;
}

export function withAppCookieOptions(options: CookieOptions, host?: string): CookieOptions {
  const domain = cookieDomainForHost(host);
  if (!domain) return options;
  return { ...options, domain };
}
