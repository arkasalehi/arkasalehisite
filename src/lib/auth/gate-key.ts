/** Full auth-cookie digest. The JWT prefix is identical for every Supabase user. */
export async function authCookieKey(cookies: Array<{ name: string; value: string }>) {
  const parts = cookies
    .filter((cookie) => cookie.name.includes("-auth-token"))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .map((cookie) => `${cookie.name}=${cookie.value}`);
  if (!parts.length) return "none";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(parts.join("\n")));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
