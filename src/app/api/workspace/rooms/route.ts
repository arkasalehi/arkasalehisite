import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace, isAdminRole } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { sanitizeText } from "@/lib/security";
import { getActiveTenantId } from "@/lib/data/workspace";
import { z } from "zod";

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
      .from("workspace_join_requests")
      .select("id, meeting_id, user_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) throw error;
    return json({ requests: data ?? [] });
  } catch (error) {
    return errorResponse(error, "en");
  }
}

async function replaceMembers(db: Awaited<ReturnType<typeof createServerSupabase>>, meetingId: string, memberIds: string[]) {
  await db.from("workspace_meeting_members").delete().eq("meeting_id", meetingId);
  const unique = [...new Set(memberIds)];
  if (unique.length) {
    await db.from("workspace_meeting_members").insert(unique.map((userId) => ({ meeting_id: meetingId, user_id: userId })));
  }
}

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-rooms", 40);
    const session = await requireUser();
    if (!canAccessWorkspace(session.role)) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const input = z
      .object({
        action: z.enum(["create", "toggle", "members", "request", "decide", "join", "leave", "delete"]),
        meetingId: z.string().uuid().optional(),
        isOpen: z.boolean().optional(),
        requestId: z.string().uuid().optional(),
        status: z.enum(["approved", "denied"]).optional(),
        title: z.string().min(1).max(80).optional(),
        memberIds: z.array(z.string().uuid()).max(40).optional(),
      })
      .parse(await request.json());
    const db = await createServerSupabase();
    const admin = isAdminRole(session.role);

    if (input.action === "create") {
      if (!admin) {
        const error = new Error("FORBIDDEN");
        error.name = "FORBIDDEN";
        throw error;
      }
      const title = sanitizeText(input.title ?? "", 80);
      if (!title) {
        const error = new Error("INVALID");
        error.name = "INVALID";
        throw error;
      }
      const tenantId = await getActiveTenantId();
      const slug = `rm-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
      const { data, error } = await db
        .from("workspace_meetings")
        .insert({
          title,
          starts_at: new Date().toISOString(),
          room_name: slug,
          created_by: session.id,
          tenant_id: tenantId,
          kind: "custom",
          owner_id: session.id,
          is_open: true,
        })
        .select("id")
        .single();
      if (error) throw error;
      await replaceMembers(db, data.id, [...new Set([session.id, ...(input.memberIds ?? [])])]);
      return json({ id: data.id });
    }

    if (!input.meetingId) {
      const error = new Error("INVALID");
      error.name = "INVALID";
      throw error;
    }

    if (input.action === "toggle") {
      const q = db.from("workspace_meetings").update({ is_open: Boolean(input.isOpen) }).eq("id", input.meetingId);
      const { error } = admin ? await q : await q.eq("owner_id", session.id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (input.action === "members") {
      if (!admin) {
        const error = new Error("FORBIDDEN");
        error.name = "FORBIDDEN";
        throw error;
      }
      await replaceMembers(db, input.meetingId, [...new Set([session.id, ...(input.memberIds ?? [])])]);
      return json({ ok: true });
    }

    if (input.action === "delete") {
      if (!admin) {
        const error = new Error("FORBIDDEN");
        error.name = "FORBIDDEN";
        throw error;
      }
      const { error } = await db.from("workspace_meetings").delete().eq("id", input.meetingId).eq("kind", "custom");
      if (error) throw error;
      return json({ ok: true });
    }

    if (input.action === "request") {
      const room = await db.from("workspace_meetings").select("id, owner_id, is_open, title").eq("id", input.meetingId).maybeSingle();
      if (!room.data?.is_open || room.data.owner_id === session.id) {
        const error = new Error("FORBIDDEN");
        error.name = "FORBIDDEN";
        throw error;
      }
      const existing = await db.from("workspace_join_requests").select("id, status").eq("meeting_id", input.meetingId).eq("user_id", session.id).maybeSingle();
      if (existing.data?.status === "approved") return json({ ok: true, status: "approved" });
      if (existing.data?.id) {
        await db.from("workspace_join_requests").update({ status: "pending", decided_at: null }).eq("id", existing.data.id);
      } else {
        await db.from("workspace_join_requests").insert({ meeting_id: input.meetingId, user_id: session.id, status: "pending" });
      }
      if (room.data.owner_id) {
        await db.from("workspace_notices").insert({
          user_id: String(room.data.owner_id),
          kind: "join_request",
          title: "Room join request",
          body: session.displayName,
          link: "/ws/meet",
        });
      }
      return json({ ok: true, status: "pending" });
    }
    if (input.action === "decide" && input.requestId && input.status) {
      const req = await db.from("workspace_join_requests").select("id, meeting_id, user_id").eq("id", input.requestId).maybeSingle();
      if (!req.data) throw Object.assign(new Error("NOT_FOUND"), { name: "NOT_FOUND" });
      const room = await db.from("workspace_meetings").select("id, owner_id").eq("id", req.data.meeting_id).maybeSingle();
      if (room.data?.owner_id !== session.id && !admin) {
        const error = new Error("FORBIDDEN");
        error.name = "FORBIDDEN";
        throw error;
      }
      await db.from("workspace_join_requests").update({ status: input.status, decided_at: new Date().toISOString() }).eq("id", input.requestId);
      await db.from("workspace_notices").insert({
        user_id: String(req.data.user_id),
        kind: "join_result",
        title: input.status === "approved" ? "Join approved" : "Join denied",
        link: `/ws/meet/${req.data.meeting_id}`,
      });
      return json({ ok: true });
    }
    if (input.action === "join") {
      const { data, error } = await db.from("workspace_call_sessions").insert({ meeting_id: input.meetingId, user_id: session.id }).select("id").single();
      if (error) throw error;
      return json({ id: data.id });
    }
    if (input.action === "leave") {
      await db.from("workspace_call_sessions").update({ left_at: new Date().toISOString() }).eq("meeting_id", input.meetingId).eq("user_id", session.id).is("left_at", null);
      return json({ ok: true });
    }
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
