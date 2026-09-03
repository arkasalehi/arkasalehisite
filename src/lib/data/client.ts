import { isNextProductionBuild } from "@/lib/runtime";
import { hasSupabaseConfig } from "@/lib/supabase";

export function canQueryDatabase() {
  return hasSupabaseConfig() && !isNextProductionBuild();
}
