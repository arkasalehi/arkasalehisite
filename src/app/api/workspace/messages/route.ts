import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { sanitizeHttpUrl, sanitizeText } from "@/lib/security";
import { listMessages, mapMessage, MESSAGE_LIMIT } from "@/lib/data/workspace";
import { isHiddenBotIdentity, redactBotMentions } from "@/lib/workspace/bot-visibility";
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

async function assertChannelAccess(channelId: string, isSuperAdmin: boolean) {
  const db = await createServerSupabase();
  if (!isSuperAdmin) {
    const row = await db.from("workspace_channels").select("slug, name, kind").eq("id", channelId).maybeSingle();
    if (row.data && isHiddenBotIdentity({ slug: row.data.slug, name: row.data.name, kind: row.data.kind })) {
      const denied = new Error("FORBIDDEN");
      denied.name = "FORBIDDEN";
      throw denied;
    }
  }
  const { data, error } = await db.rpc("can_access_channel", { p_channel_id: channelId });
  if (error) return;
  if (!data) {
    const denied = new Error("FORBIDDEN");
    denied.name = "FORBIDDEN";
    throw denied;
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireWorkspace();
    const url = new URL(request.url);
    const channelId = z.string().uuid().parse(url.searchParams.get("channelId"));
    const before = url.searchParams.get("before") || undefined;
    const limit = Math.min(MESSAGE_LIMIT, Math.max(1, Number(url.searchParams.get("limit") ?? MESSAGE_LIMIT) || MESSAGE_LIMIT));
    await assertChannelAccess(channelId, session.isSuperAdmin);
    const messages = await listMessages(channelId, session.id, limit, before, session);
    return json({ messages, hasMore: messages.length >= limit });
  } catch (error) {
    return errorResponse(error, "en");
  }
}

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-chat", 40);
    const session = await requireWorkspace();
    const input = messageSchema.parse(await request.json());
    await assertChannelAccess(input.channelId, session.isSuperAdmin);
    const db = await createServerSupabase();
    const fileUrl = sanitizeHttpUrl(input.fileUrl);
    const row: Record<string, unknown> = {
      channel_id: input.channelId,
      user_id: session.id,
      body: sanitizeText(input.body, 4000),
      kind: input.kind ?? "text",
      file_name: input.fileName ? sanitizeText(input.fileName, 180) : null,
      file_url: fileUrl,
      reply_to: input.replyTo || null,
    };
    const selectCols = "id, channel_id, user_id, body, created_at, kind, file_name, file_url, reply_to";
    const { data, error } = await db.from("workspace_messages").insert(row).select(selectCols).single();
    if (error) {
      const basic = await db
        .from("workspace_messages")
        .insert({ channel_id: input.channelId, user_id: session.id, body: sanitizeText(input.body, 4000) })
        .select(selectCols)
        .single();
      if (basic.error) throw basic.error;
      return json({
        id: basic.data.id,
        message: {
          ...mapMessage(basic.data as Record<string, unknown>),
          body: redactBotMentions(String(basic.data.body ?? ""), session),
          author: { displayName: session.displayName, username: session.username, avatarUrl: session.avatarUrl },
        },
      });
    }
    return json({
      id: data.id,
      message: {
        ...mapMessage(data as Record<string, unknown>),
        body: redactBotMentions(String(data.body ?? ""), session),
        author: { displayName: session.displayName, username: session.username, avatarUrl: session.avatarUrl },
      },
    });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
