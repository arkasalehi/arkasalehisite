import { getSession } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/auth/roles";
import { getProfile } from "@/lib/data/users";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { loginSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    guardMutation(request, "login", 8);
    const body = loginSchema.parse(await request.json());
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email.toLowerCase(),
      password: body.password,
    });
    if (error || !data.user) {
      return json({ error: "ایمیل یا رمز عبور نادرست است" }, 401);
    }
    const profile = await getProfile(data.user.id);
    const session = {
      id: data.user.id,
      email: profile?.email ?? data.user.email ?? body.email,
      username: profile?.username ?? String(data.user.user_metadata?.username ?? ""),
      displayName: profile?.displayName ?? String(data.user.user_metadata?.display_name ?? ""),
      role: normalizeRole(profile?.role),
    };
    return json({ user: session });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return json({ user: null }, 401);
    return json({ user: session });
  } catch (error) {
    return errorResponse(error);
  }
}
