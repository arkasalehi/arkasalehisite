import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace, isAdminRole } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { sanitizeHttpUrl, sanitizeText } from "@/lib/security";
import { listStudioFiles } from "@/lib/data/studio";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await requireUser();
    if (!canAccessWorkspace(session.role)) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const projectId = new URL(request.url).searchParams.get("projectId") || undefined;
    const files = await listStudioFiles(projectId);
    return json({ files });
  } catch (error) {
    return errorResponse(error, "en");
  }
}

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-project-files", 30);
    const session = await requireUser();
    if (!canAccessWorkspace(session.role)) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const input = z
      .object({
        projectId: z.string().uuid(),
        name: z.string().min(1).max(180),
        url: z.string().min(8).max(2000),
        mime: z.string().max(120).optional(),
        sizeBytes: z.number().int().min(1).max(5 * 1024 * 1024).optional(),
      })
      .parse(await request.json());
    const url = sanitizeHttpUrl(input.url);
    if (!url) {
      const error = new Error("INVALID");
      error.name = "INVALID";
      throw error;
    }
    const db = await createServerSupabase();
    const project = await db.from("workspace_projects").select("id, status").eq("id", input.projectId).maybeSingle();
    const member = await db.from("workspace_project_members").select("user_id").eq("project_id", input.projectId).eq("user_id", session.id).maybeSingle();
    if (!project.data || (String(project.data.status) !== "active" && !isAdminRole(session.role)) || (!member.data && !isAdminRole(session.role))) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const { data, error } = await db
      .from("workspace_project_files")
      .insert({
        project_id: input.projectId,
        user_id: session.id,
        name: sanitizeText(input.name, 180),
        url,
        mime: sanitizeText(input.mime ?? "", 120),
        size_bytes: input.sizeBytes ?? 0,
      })
      .select("id")
      .single();
    if (error) throw error;
    return json({ id: data.id });
  } catch (error) {
    return errorResponse(error, "en");
  }
}

export async function DELETE(request: Request) {
  try {
    await guardMutation(request, "workspace-project-files", 30);
    await requireUser();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw Object.assign(new Error("NOT_FOUND"), { name: "NOT_FOUND" });
    const db = await createServerSupabase();
    const { error } = await db.from("workspace_project_files").delete().eq("id", id);
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
