import { isNextProductionBuild } from "@/lib/runtime";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export function canQueryDatabase() {
  return hasSupabaseConfig() && !isNextProductionBuild();
}

/** Anon client — no cookies()/headers(), so public ISR stays cacheable. */
export function publicDb() {
  return supabase;
}
