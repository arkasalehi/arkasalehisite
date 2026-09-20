import { requireUser } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { updatePasswordSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await guardMutation(request, "update-password", 6);
    await requireUser();
    const body = updatePasswordSchema.parse(await request.json());
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.updateUser({ password: body.password });
    if (error) return json({ error: "تغییر رمز انجام نشد" }, 400);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
