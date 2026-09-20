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
  parentId: z.string().uuid().optional().nullable(),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["todo", "doing", "done"]).optional(),
  title: z.string().min(1).max(160).optional(),
  sort: z.number().int().optional(),
  description: z.string().max(4000).optional().nullable(),
  dueAt: z.string().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
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
        parent_id: input.parentId || null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return json({ id: data.id });
  } catch (error) {
    return errorResponse(error, "en");
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
    if (input.description !== undefined) patch.description = input.description ? sanitizeText(input.description, 4000) : null;
    if (input.dueAt !== undefined) patch.due_at = input.dueAt || null;
    if (input.parentId !== undefined) patch.parent_id = input.parentId;
    const { error } = await db.from("workspace_tasks").update(patch).eq("id", input.id);
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, "en");
  }
}

export async function DELETE(request: Request) {
  try {
    await guardMutation(request, "workspace-tasks", 40);
    await requireWorkspace();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      const error = new Error("NOT_FOUND");
      error.name = "NOT_FOUND";
      throw error;
    }
    const db = await createServerSupabase();
    const { error } = await db.from("workspace_tasks").delete().eq("id", id);
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
