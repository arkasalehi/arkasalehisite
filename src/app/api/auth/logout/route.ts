import { createRouteSupabase, jsonWithCookies } from "@/lib/supabase/server";
import { guardMutation, json, errorResponse } from "@/lib/http";
import type { CookieOptions } from "@supabase/ssr";

export async function POST(request: Request) {
  try {
    await guardMutation(request, "logout", 20);
    const jar: Array<{ name: string; value: string; options: CookieOptions }> = [];
    const supabase = createRouteSupabase(request, jar);
    await supabase.auth.signOut();
    return jsonWithCookies(request, { ok: true }, jar);
  } catch (error) {
    return errorResponse(error);
  }
}
