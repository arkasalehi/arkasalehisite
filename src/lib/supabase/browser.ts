"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase";

export function createBrowserSupabase() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
