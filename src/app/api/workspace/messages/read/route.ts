import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-chat-read", 80);
    const session = await requireUser();
    if (!canAccessWorkspace(session.role)) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const input = z.object({ channelId: z.string().uuid() }).parse(await request.json());
    const db = await createServerSupabase();
    const { data: allowed, error: accessError } = await db.rpc("can_access_channel", { p_channel_id: input.channelId });
    if (!accessError && !allowed) {
      const denied = new Error("FORBIDDEN");
      denied.name = "FORBIDDEN";
      throw denied;
    }
    const { error } = await db.from("workspace_channel_reads").upsert(
      { channel_id: input.channelId, user_id: session.id, last_read_at: new Date().toISOString() },
      { onConflict: "channel_id,user_id" },
    );
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
