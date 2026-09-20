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

const schema = z.object({
  title: z.string().min(2).max(120),
  startsAt: z.string().min(8),
  endsAt: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-meet", 20);
    const session = await requireWorkspace();
    const input = schema.parse(await request.json());
    const room = `arka-${crypto.randomUUID().slice(0, 8)}`;
    const db = await createServerSupabase();
    const { data, error } = await db
      .from("workspace_meetings")
      .insert({
        title: sanitizeText(input.title, 120),
        starts_at: input.startsAt,
        ends_at: input.endsAt || null,
        room_name: room,
        created_by: session.id,
      })
      .select("id, room_name")
      .single();
    if (error) throw error;
    return json({ id: data.id, roomName: data.room_name });
  } catch (error) {
    return errorResponse(error);
  }
}
