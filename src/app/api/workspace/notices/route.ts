import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, json } from "@/lib/http";
import { redactBotMentions } from "@/lib/workspace/bot-visibility";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireUser();
    if (!canAccessWorkspace(session.role)) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const db = await createServerSupabase();
    const { data, error } = await db
      .from("workspace_notices")
      .select("id, title, body, link, read, created_at, kind")
      .eq("user_id", session.id)
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) throw error;
    const notices = (data ?? []).map((row) => ({
      ...row,
      title: redactBotMentions(String(row.title ?? ""), session),
      body: row.body ? redactBotMentions(String(row.body), session) : row.body,
    }));
    const unread = notices.filter((row) => !row.read).length;
    return json({ notices, unread });
  } catch (error) {
    return errorResponse(error, "en");
  }
}

export async function POST() {
  try {
    const session = await requireUser();
    const db = await createServerSupabase();
    await db.from("workspace_notices").update({ read: true }).eq("user_id", session.id).eq("read", false);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
