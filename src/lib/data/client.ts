import "server-only";
import { isNextProductionBuild } from "@/lib/runtime";
import { supabase } from "@/lib/supabase";

/** Anon client — no cookies()/headers(), so public ISR stays cacheable. */
export function publicDb() {
  return supabase;
}

/**
 * A production build often cannot read Supabase. Bail out of static
 * generation so the route stays request-time rendered instead of caching
 * an empty shell. No-op on a real request.
 */
export async function discardStaticIfBuild() {
  if (!isNextProductionBuild()) return;
  const { connection } = await import("next/server");
  await connection();
}
