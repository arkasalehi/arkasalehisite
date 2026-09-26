import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace, isAdminRole } from "@/lib/auth/roles";
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
  title: z.string().min(1).max(160),
  parentId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid(),
  dueAt: z.string().optional().nullable(),
  assigneeIds: z.array(z.string().uuid()).max(8).optional(),
  description: z.string().max(4000).optional(),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["todo", "doing", "done"]).optional(),
  title: z.string().min(1).max(160).optional(),
  description: z.string().max(4000).optional().nullable(),
  dueAt: z.string().optional().nullable(),
  assigneeIds: z.array(z.string().uuid()).max(8).optional(),
  extraHours: z.number().int().min(1).max(720).optional(),
  reason: z.string().max(400).optional(),
  extensionId: z.string().uuid().optional(),
  extensionStatus: z.enum(["approved", "denied"]).optional(),
});

async function replaceAssignees(db: Awaited<ReturnType<typeof createServerSupabase>>, taskId: string, assigneeIds: string[]) {
  await db.from("workspace_task_assignees").delete().eq("task_id", taskId);
  const unique = [...new Set(assigneeIds)];
  if (unique.length) {
    await db.from("workspace_task_assignees").insert(unique.map((userId) => ({ task_id: taskId, user_id: userId })));
  }
  await db.from("workspace_tasks").update({ assignee_id: unique[0] ?? null }).eq("id", taskId);
}

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-tasks", 40);
    const session = await requireWorkspace();
    const input = createSchema.parse(await request.json());
    if (!isAdminRole(session.role)) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const db = await createServerSupabase();
    const tenantId = await getActiveTenantId();
    const project = await db.from("workspace_projects").select("status").eq("id", input.projectId).maybeSingle();
    if (!project.data || String(project.data.status) !== "active") {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const { data, error } = await db
      .from("workspace_tasks")
      .insert({
        title: sanitizeText(input.title, 160),
        created_by: session.id,
        parent_id: input.parentId || null,
        tenant_id: tenantId,
        project_id: input.projectId,
        due_at: input.dueAt || null,
        description: input.description ? sanitizeText(input.description, 4000) : null,
        assignee_id: input.assigneeIds?.[0] ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    if (input.assigneeIds?.length) await replaceAssignees(db, data.id, input.assigneeIds);
    return json({ id: data.id });
  } catch (error) {
    return errorResponse(error, "en");
  }
}

export async function PATCH(request: Request) {
  try {
    await guardMutation(request, "workspace-tasks", 40);
    const session = await requireWorkspace();
    const input = patchSchema.parse(await request.json());
    const db = await createServerSupabase();
    if (input.extraHours) {
      const task = await db.from("workspace_tasks").select("id, assignee_id").eq("id", input.id).maybeSingle();
      const assigned = await db.from("workspace_task_assignees").select("user_id").eq("task_id", input.id).eq("user_id", session.id).maybeSingle();
      const isAssignee = String(task.data?.assignee_id) === session.id || Boolean(assigned.data);
      if (!isAdminRole(session.role) && !isAssignee) {
        const error = new Error("FORBIDDEN");
        error.name = "FORBIDDEN";
        throw error;
      }
      const { error } = await db.from("workspace_task_extensions").insert({
        task_id: input.id,
        user_id: session.id,
        extra_hours: input.extraHours,
        reason: sanitizeText(input.reason ?? "", 400),
        status: "pending",
      });
      if (error) throw error;
      const admins = await db.from("profiles").select("id").eq("role", "admin");
      if (admins.data?.length) {
        await db.from("workspace_notices").insert(
          admins.data.map((row) => ({
            user_id: String(row.id),
            kind: "extension",
            title: "Time extension requested",
            body: sanitizeText(input.reason ?? "", 400),
            link: "/ws/tasks",
          })),
        );
      }
      return json({ ok: true });
    }
    if (input.extensionId && input.extensionStatus) {
      if (!isAdminRole(session.role)) {
        const error = new Error("FORBIDDEN");
        error.name = "FORBIDDEN";
        throw error;
      }
      const ext = await db.from("workspace_task_extensions").select("id, task_id, extra_hours, user_id").eq("id", input.extensionId).maybeSingle();
      if (!ext.data) throw Object.assign(new Error("NOT_FOUND"), { name: "NOT_FOUND" });
      await db
        .from("workspace_task_extensions")
        .update({ status: input.extensionStatus, decided_by: session.id, decided_at: new Date().toISOString() })
        .eq("id", input.extensionId);
      if (input.extensionStatus === "approved") {
        const task = await db.from("workspace_tasks").select("due_at").eq("id", ext.data.task_id).maybeSingle();
        const base = task.data?.due_at ? new Date(String(task.data.due_at)).getTime() : Date.now();
        const next = new Date(base + Number(ext.data.extra_hours) * 3600_000).toISOString();
        await db.from("workspace_tasks").update({ due_at: next }).eq("id", ext.data.task_id);
      }
      await db.from("workspace_notices").insert({
        user_id: String(ext.data.user_id),
        kind: "extension",
        title: input.extensionStatus === "approved" ? "Extra time approved" : "Extra time denied",
        link: "/ws/tasks",
      });
      return json({ ok: true });
    }
    const task = await db.from("workspace_tasks").select("id, created_by, assignee_id, project_id").eq("id", input.id).maybeSingle();
    if (!task.data) throw Object.assign(new Error("NOT_FOUND"), { name: "NOT_FOUND" });
    const assigned = await db.from("workspace_task_assignees").select("user_id").eq("task_id", input.id).eq("user_id", session.id).maybeSingle();
    const isAssignee = String(task.data.assignee_id) === session.id || Boolean(assigned.data);
    const admin = isAdminRole(session.role);
    if (!admin && !isAssignee) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const patch: Record<string, unknown> = {};
    if (input.status) patch.status = input.status;
    if (admin) {
      if (input.title) patch.title = sanitizeText(input.title, 160);
      if (input.description !== undefined) patch.description = input.description ? sanitizeText(input.description, 4000) : null;
      if (input.dueAt !== undefined) patch.due_at = input.dueAt || null;
    }
    if (Object.keys(patch).length) {
      const { error } = await db.from("workspace_tasks").update(patch).eq("id", input.id);
      if (error) throw error;
    }
    if (admin && input.assigneeIds) await replaceAssignees(db, input.id, input.assigneeIds);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, "en");
  }
}

export async function DELETE(request: Request) {
  try {
    await guardMutation(request, "workspace-tasks", 40);
    const session = await requireWorkspace();
    if (!isAdminRole(session.role)) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw Object.assign(new Error("NOT_FOUND"), { name: "NOT_FOUND" });
    const db = await createServerSupabase();
    const { error } = await db.from("workspace_tasks").delete().eq("id", id);
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
