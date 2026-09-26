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

function requireAdmin(role: string) {
  if (!isAdminRole(role)) {
    const error = new Error("FORBIDDEN");
    error.name = "FORBIDDEN";
    throw error;
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(80),
  identifier: z.string().min(2).max(8).optional(),
  description: z.string().max(500).optional(),
  memberIds: z.array(z.string().uuid()).max(40).optional(),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(["active", "locked", "inactive"]).optional(),
  memberIds: z.array(z.string().uuid()).max(40).optional(),
  boardBody: z.string().max(20000).optional(),
});

async function syncProjectChannel(
  db: Awaited<ReturnType<typeof createServerSupabase>>,
  projectId: string,
  channelId: string,
  memberIds: string[],
) {
  await db.from("workspace_channel_members").delete().eq("channel_id", channelId);
  if (memberIds.length) {
    await db.from("workspace_channel_members").insert(memberIds.map((userId) => ({ channel_id: channelId, user_id: userId })));
  }
  void projectId;
}

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-projects", 20);
    const session = await requireWorkspace();
    requireAdmin(session.role);
    const input = createSchema.parse(await request.json());
    const tenantId = await getActiveTenantId();
    if (!tenantId) throw Object.assign(new Error("NOT_FOUND"), { name: "NOT_FOUND" });
    const db = await createServerSupabase();
    const identifier = sanitizeText((input.identifier ?? input.name).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "PRJ", 8);
    const name = sanitizeText(input.name, 80);
    const { data, error } = await db
      .from("workspace_projects")
      .insert({
        tenant_id: tenantId,
        name,
        identifier,
        description: sanitizeText(input.description ?? "", 500),
        created_by: session.id,
        manager_id: session.id,
        status: "active",
      })
      .select("id")
      .single();
    if (error) throw error;
    const memberIds = [...new Set([session.id, ...(input.memberIds ?? [])])];
    await db.from("workspace_project_members").insert(
      memberIds.map((userId) => ({ project_id: data.id, user_id: userId, role: userId === session.id ? "manager" : "member" })),
    );
    const slug = `prj-${data.id.replace(/-/g, "").slice(0, 12)}`;
    const channel = await db
      .from("workspace_channels")
      .insert({ slug, name, kind: "group", tenant_id: tenantId, project_id: data.id })
      .select("id")
      .single();
    if (channel.error || !channel.data?.id) throw channel.error ?? new Error("channel");
    await syncProjectChannel(db, data.id, channel.data.id, memberIds);
    const meeting = await db
      .from("workspace_meetings")
      .insert({
        title: name,
        starts_at: new Date().toISOString(),
        room_name: slug,
        created_by: session.id,
        tenant_id: tenantId,
        kind: "project",
        project_id: data.id,
        is_open: true,
      })
      .select("id")
      .single();
    const board = await db
      .from("workspace_notes")
      .insert({ title: name, color: "lilac", created_by: session.id, body: "", tenant_id: tenantId, project_id: data.id })
      .select("id")
      .single();
    await db
      .from("workspace_projects")
      .update({
        channel_id: channel.data?.id ?? null,
        meeting_id: meeting.data?.id ?? null,
        board_id: board.data?.id ?? null,
      })
      .eq("id", data.id);
    return json({ id: data.id, channelId: channel.data?.id, meetingId: meeting.data?.id });
  } catch (error) {
    return errorResponse(error, "en");
  }
}

export async function PATCH(request: Request) {
  try {
    await guardMutation(request, "workspace-projects", 30);
    const session = await requireWorkspace();
    const input = patchSchema.parse(await request.json());
    const db = await createServerSupabase();
    if (input.boardBody !== undefined && !isAdminRole(session.role)) {
      const member = await db.from("workspace_project_members").select("user_id").eq("project_id", input.id).eq("user_id", session.id).maybeSingle();
      if (!member.data) {
        const error = new Error("FORBIDDEN");
        error.name = "FORBIDDEN";
        throw error;
      }
      const project = await db.from("workspace_projects").select("board_id, status").eq("id", input.id).maybeSingle();
      if (project.data?.status !== "active" && !isAdminRole(session.role)) {
        const error = new Error("FORBIDDEN");
        error.name = "FORBIDDEN";
        throw error;
      }
      if (project.data?.board_id) {
        await db.from("workspace_notes").update({ body: sanitizeText(input.boardBody, 20000), updated_at: new Date().toISOString() }).eq("id", project.data.board_id);
      }
      return json({ ok: true });
    }
    requireAdmin(session.role);
    const patch: Record<string, unknown> = {};
    if (input.name) patch.name = sanitizeText(input.name, 80);
    if (input.description !== undefined) patch.description = sanitizeText(input.description, 500);
    if (input.status) patch.status = input.status;
    if (Object.keys(patch).length) {
      const { error } = await db.from("workspace_projects").update(patch).eq("id", input.id);
      if (error) throw error;
    }
    if (input.name) {
      const linked = await db.from("workspace_projects").select("channel_id, meeting_id").eq("id", input.id).maybeSingle();
      if (linked.data?.channel_id) await db.from("workspace_channels").update({ name: patch.name }).eq("id", linked.data.channel_id);
      if (linked.data?.meeting_id) await db.from("workspace_meetings").update({ title: patch.name }).eq("id", linked.data.meeting_id);
    }
    if (input.memberIds) {
      const memberIds = [...new Set([session.id, ...input.memberIds])];
      await db.from("workspace_project_members").delete().eq("project_id", input.id);
      await db.from("workspace_project_members").insert(
        memberIds.map((userId) => ({ project_id: input.id, user_id: userId, role: userId === session.id ? "manager" : "member" })),
      );
      const project = await db.from("workspace_projects").select("channel_id").eq("id", input.id).maybeSingle();
      if (project.data?.channel_id) await syncProjectChannel(db, input.id, String(project.data.channel_id), memberIds);
    }
    if (input.boardBody !== undefined) {
      const project = await db.from("workspace_projects").select("board_id").eq("id", input.id).maybeSingle();
      if (project.data?.board_id) {
        await db.from("workspace_notes").update({ body: sanitizeText(input.boardBody, 20000), updated_at: new Date().toISOString() }).eq("id", project.data.board_id);
      }
    }
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, "en");
  }
}

export async function DELETE(request: Request) {
  try {
    await guardMutation(request, "workspace-projects", 20);
    const session = await requireWorkspace();
    requireAdmin(session.role);
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw Object.assign(new Error("NOT_FOUND"), { name: "NOT_FOUND" });
    const db = await createServerSupabase();
    const linked = await db.from("workspace_projects").select("channel_id, meeting_id").eq("id", id).maybeSingle();
    const { error } = await db.from("workspace_projects").delete().eq("id", id);
    if (error) throw error;
    if (linked.data?.channel_id) await db.from("workspace_channels").delete().eq("id", linked.data.channel_id);
    if (linked.data?.meeting_id) await db.from("workspace_meetings").delete().eq("id", linked.data.meeting_id);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
