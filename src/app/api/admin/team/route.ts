import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["user", "admin", "collaborator"]),
});

export async function GET() {
  try {
    await requireAdmin();
    const db = await createServerSupabase();
    const { data, error } = await db.rpc("admin_list_profiles");
    if (error) throw error;
    return json({ users: data ?? [] });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await guardMutation(request, "admin-team", 20);
    await requireAdmin();
    const input = schema.parse(await request.json());
    const db = await createServerSupabase();
    const { error } = await db.rpc("set_profile_role", { p_user_id: input.userId, p_role: input.role });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("last_admin")) return json({ error: "نمی‌توان آخرین ادمین را تغییر داد" }, 400);
      throw error;
    }
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
