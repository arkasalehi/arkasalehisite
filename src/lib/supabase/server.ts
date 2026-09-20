import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { withAppCookieOptions } from "@/lib/auth/cookies";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase";

export async function createServerSupabase() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  }

  const store = await cookies();
  const host = (await headers()).get("host") ?? undefined;
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            store.set(name, value, withAppCookieOptions(options, host));
          }
        } catch {
          /* Server Components cannot always set cookies; proxy refreshes the session. */
        }
      },
    },
  });
}
