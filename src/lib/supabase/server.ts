import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { withAppCookieOptions } from "@/lib/auth/cookies";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase";
import { fetchWithTimeout } from "@/lib/supabase/fetch";
import type { CookieOptions } from "@supabase/ssr";

function cookiesFromRequest(request: Request) {
  const header = request.headers.get("cookie") ?? "";
  if (!header) return [];
  return header
    .split(";")
    .map((part) => {
      const [name, ...rest] = part.trim().split("=");
      return { name, value: rest.join("=") };
    })
    .filter((item) => item.name);
}

export function createRouteSupabase(request: Request, jar: Array<{ name: string; value: string; options: CookieOptions }>) {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  }
  return createServerClient(url, key, {
    global: { fetch: fetchWithTimeout() },
    cookies: {
      getAll() {
        return cookiesFromRequest(request);
      },
      setAll(cookiesToSet) {
        jar.push(...cookiesToSet);
      },
    },
  });
}

export function jsonWithCookies<T>(
  request: Request,
  body: T,
  jar: Array<{ name: string; value: string; options: CookieOptions }>,
  status = 200,
) {
  const response = NextResponse.json(body, { status });
  const host = request.headers.get("host") ?? undefined;
  for (const { name, value, options } of jar) {
    response.cookies.set(name, value, withAppCookieOptions(options, host));
  }
  return response;
}

export async function createServerSupabase() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  }

  const store = await cookies();
  const host = (await headers()).get("host") ?? undefined;
  return createServerClient(url, key, {
    global: { fetch: fetchWithTimeout() },
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
