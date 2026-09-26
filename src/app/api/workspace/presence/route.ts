import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-presence", 120);
    const session = await requireUser();
    if (!canAccessWorkspace(session.role)) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const db = await createServerSupabase();
    const { error } = await db.from("workspace_presence").upsert({ user_id: session.id, last_seen: new Date().toISOString() });
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
