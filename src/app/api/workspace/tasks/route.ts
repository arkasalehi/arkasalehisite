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

const createSchema = z.object({
  title: z.string().min(1).max(160),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["todo", "doing", "done"]).optional(),
  title: z.string().min(1).max(160).optional(),
  sort: z.number().int().optional(),
});

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-tasks", 40);
    const session = await requireWorkspace();
    const input = createSchema.parse(await request.json());
    const db = await createServerSupabase();
    const { data, error } = await db
      .from("workspace_tasks")
      .insert({
        title: sanitizeText(input.title, 160),
        created_by: session.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    return json({ id: data.id });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await guardMutation(request, "workspace-tasks", 40);
    await requireWorkspace();
    const input = patchSchema.parse(await request.json());
    const db = await createServerSupabase();
    const patch: Record<string, unknown> = {};
    if (input.status) patch.status = input.status;
    if (input.title) patch.title = sanitizeText(input.title, 160);
    if (typeof input.sort === "number") patch.sort = input.sort;
    const { error } = await db.from("workspace_tasks").update(patch).eq("id", input.id);
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
