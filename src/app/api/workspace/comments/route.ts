import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { sanitizeText } from "@/lib/security";
import { listTaskComments } from "@/lib/data/workspace";
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

export async function GET(request: Request) {
  try {
    await requireWorkspace();
    const taskId = new URL(request.url).searchParams.get("taskId");
    if (!taskId) return json({ comments: [] });
    const comments = await listTaskComments(taskId);
    return json({ comments });
  } catch (error) {
    return errorResponse(error, "en");
  }
}

const schema = z.object({
  taskId: z.string().uuid(),
  body: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-comments", 40);
    const session = await requireWorkspace();
    const input = schema.parse(await request.json());
    const db = await createServerSupabase();
    const { data, error } = await db
      .from("workspace_task_comments")
      .insert({ task_id: input.taskId, user_id: session.id, body: sanitizeText(input.body, 2000) })
      .select("id")
      .single();
    if (error) throw error;
    return json({ id: data.id });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
