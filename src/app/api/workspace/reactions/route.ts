import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

async function requireWorkspace() {
  const session = await requireUser();
  if (!canAccessWorkspace(session.role)) {
    const error = new Error("FORBIDDEN");
    error.name = "FORBIDDEN";
    throw error;
  }
  return session;
}

const schema = z.object({
  messageId: z.string().uuid(),
  emoji: z.string().min(1).max(8),
});

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-react", 60);
    const session = await requireWorkspace();
    const input = schema.parse(await request.json());
    const db = await createServerSupabase();
    const existing = await db
      .from("workspace_reactions")
      .select("emoji")
      .eq("message_id", input.messageId)
      .eq("user_id", session.id)
      .eq("emoji", input.emoji)
      .maybeSingle();
    if (existing.data) {
      await db
        .from("workspace_reactions")
        .delete()
        .eq("message_id", input.messageId)
        .eq("user_id", session.id)
        .eq("emoji", input.emoji);
      return json({ ok: true, removed: true });
    }
    const { error } = await db.from("workspace_reactions").insert({
      message_id: input.messageId,
      user_id: session.id,
      emoji: input.emoji,
    });
    if (error) throw error;
    return json({ ok: true, removed: false });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
