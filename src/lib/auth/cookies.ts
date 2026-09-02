export const ACCESS_COOKIE = "as_access";
export const REFRESH_COOKIE = "as_refresh";
/** Legacy 30-day JWT; still accepted during migration. */
export const SESSION_COOKIE = "as_session";

export function authCookieOptions(maxAge: number) {
  const domain = process.env.COOKIE_DOMAIN;
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
    ...(domain ? { domain } : {}),
  };
}
