import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { sanitizeText } from "@/lib/security";
import { getActiveTenantId } from "@/lib/data/workspace";
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
  title: z.string().min(1).max(80),
  body: z.string().max(20000).optional(),
  color: z.enum(["lilac", "cream", "mint", "sky"]).optional(),
  linkedTaskId: z.string().uuid().optional().nullable(),
  fileUrls: z.array(z.string()).optional(),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(80).optional(),
  body: z.string().max(20000).optional(),
  color: z.enum(["lilac", "cream", "mint", "sky"]).optional(),
  linkedTaskId: z.string().uuid().optional().nullable(),
  fileUrls: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-notes", 30);
    const session = await requireWorkspace();
    const input = createSchema.parse(await request.json());
    const db = await createServerSupabase();
    const tenantId = await getActiveTenantId();
    const row: Record<string, unknown> = {
      title: sanitizeText(input.title, 80),
      color: input.color ?? "lilac",
      created_by: session.id,
      body: sanitizeText(input.body ?? "", 20000),
      tenant_id: tenantId,
      linked_task_id: input.linkedTaskId || null,
      file_urls: input.fileUrls ?? [],
    };
    const { data, error } = await db.from("workspace_notes").insert(row).select("id").single();
    if (error) {
      const fallback = await db
        .from("workspace_notes")
        .insert({ title: sanitizeText(input.title, 80), color: input.color ?? "lilac", created_by: session.id })
        .select("id")
        .single();
      if (fallback.error) throw fallback.error;
      return json({ id: fallback.data.id });
    }
    return json({ id: data.id });
  } catch (error) {
    return errorResponse(error, "en");
  }
}

export async function PATCH(request: Request) {
  try {
    await guardMutation(request, "workspace-notes", 30);
    await requireWorkspace();
    const input = patchSchema.parse(await request.json());
    const db = await createServerSupabase();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.title) patch.title = sanitizeText(input.title, 80);
    if (input.body !== undefined) patch.body = sanitizeText(input.body, 20000);
    if (input.color) patch.color = input.color;
    if (input.linkedTaskId !== undefined) patch.linked_task_id = input.linkedTaskId;
    if (input.fileUrls) patch.file_urls = input.fileUrls;
    const { error } = await db.from("workspace_notes").update(patch).eq("id", input.id);
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
