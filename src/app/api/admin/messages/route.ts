import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

const patchSchema = z.object({
  id: z.string().uuid(),
  read: z.boolean(),
});

export async function GET() {
  try {
    await requireAdmin();
    const db = await createServerSupabase();
    const { data, error } = await db
      .from("contact_messages")
      .select("id, name, email, message, read, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return json({ messages: [], error: error.message }, 200);
    return json({ messages: data ?? [], error: null });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await guardMutation(request, "admin-messages", 40);
    await requireAdmin();
    const input = patchSchema.parse(await request.json());
    const db = await createServerSupabase();
    const { error } = await db.from("contact_messages").update({ read: input.read }).eq("id", input.id);
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
