import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { sanitizeText } from "@/lib/security";
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

const messageSchema = z.object({
  channelId: z.string().uuid(),
  body: z.string().min(1).max(4000),
  kind: z.enum(["text", "file", "voice"]).optional(),
  fileName: z.string().max(180).optional().nullable(),
  fileUrl: z.string().max(2000).optional().nullable(),
  replyTo: z.string().uuid().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-chat", 40);
    const session = await requireWorkspace();
    const input = messageSchema.parse(await request.json());
    const db = await createServerSupabase();
    const row: Record<string, unknown> = {
      channel_id: input.channelId,
      user_id: session.id,
      body: sanitizeText(input.body, 4000),
      kind: input.kind ?? "text",
      file_name: input.fileName ? sanitizeText(input.fileName, 180) : null,
      file_url: input.fileUrl || null,
      reply_to: input.replyTo || null,
    };
    const { data, error } = await db.from("workspace_messages").insert(row).select("id").single();
    if (error) {
      const basic = await db
        .from("workspace_messages")
        .insert({ channel_id: input.channelId, user_id: session.id, body: sanitizeText(input.body, 4000) })
        .select("id")
        .single();
      if (basic.error) throw basic.error;
      return json({ id: basic.data.id });
    }
    return json({ id: data.id });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
