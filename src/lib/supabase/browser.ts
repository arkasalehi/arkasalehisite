"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase";

export function createBrowserSupabase() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}

/** Put the cookie session on the realtime socket before a channel joins. Otherwise RLS runs as anon. */
export async function ensureRealtimeAuth(client: ReturnType<typeof createBrowserSupabase>) {
  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;
  if (token) await client.realtime.setAuth(token);
}
