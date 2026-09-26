import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace, isAdminRole } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { sanitizeText } from "@/lib/security";
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
      .from("workspace_calendar_events")
      .select("id, title, body, starts_at, ends_at, notify_at")
      .order("starts_at")
      .limit(120);
    if (error) throw error;
    return json({ events: data ?? [] });
  } catch (error) {
    return errorResponse(error, "en");
  }
}

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-events", 20);
    const session = await requireUser();
    if (!canAccessWorkspace(session.role) || !isAdminRole(session.role)) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const input = z
      .object({
        title: z.string().min(1).max(120),
        body: z.string().max(2000).optional(),
        startsAt: z.string().min(8),
        endsAt: z.string().optional().nullable(),
        notifyAt: z.string().optional().nullable(),
      })
      .parse(await request.json());
    const db = await createServerSupabase();
    const { data, error } = await db
      .from("workspace_calendar_events")
      .insert({
        title: sanitizeText(input.title, 120),
        body: sanitizeText(input.body ?? "", 2000),
        starts_at: input.startsAt,
        ends_at: input.endsAt || null,
        notify_at: input.notifyAt || null,
        created_by: session.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    if (input.notifyAt) {
      const people = await db.from("profiles").select("id").in("role", ["admin", "collaborator"]);
      if (people.data?.length) {
        await db.from("workspace_notices").insert(
          people.data.map((row) => ({
            user_id: String(row.id),
            kind: "event",
            title: sanitizeText(input.title, 120),
            body: sanitizeText(input.body ?? "", 2000),
            link: "/ws#calendar",
          })),
        );
      }
    }
    return json({ id: data.id });
  } catch (error) {
    return errorResponse(error, "en");
  }
}

export async function DELETE(request: Request) {
  try {
    await guardMutation(request, "workspace-events", 20);
    const session = await requireUser();
    if (!isAdminRole(session.role)) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw Object.assign(new Error("NOT_FOUND"), { name: "NOT_FOUND" });
    const db = await createServerSupabase();
    const { error } = await db.from("workspace_calendar_events").delete().eq("id", id);
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
