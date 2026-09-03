import { createServerSupabase } from "@/lib/supabase/server";
import { findUserByEmail, findUserByUsername, getProfile } from "@/lib/data/users";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { registerSchema } from "@/lib/validators";
import { sanitizeText } from "@/lib/security";
import { publicSiteUrl } from "@/lib/runtime";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    guardMutation(request, "register", 5);
    const body = registerSchema.parse(await request.json());
    const email = body.email.toLowerCase();
    const username = sanitizeText(body.username, 24).toLowerCase();
    const displayName = sanitizeText(body.displayName, 48);

    if (await findUserByEmail(email)) return json({ error: "این ایمیل قبلاً ثبت شده" }, 409);
    if (await findUserByUsername(username)) return json({ error: "این نام کاربری گرفته شده" }, 409);

    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: body.password,
      options: {
        data: { username, display_name: displayName },
        emailRedirectTo: `${publicSiteUrl()}/dashboard`,
      },
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered")) {
        return json({ error: "این ایمیل قبلاً ثبت شده" }, 409);
      }
      return json({ error: "ثبت‌نام انجام نشد" }, 400);
    }
    if (!data.session || !data.user) {
      return json({ error: "حساب ساخته شد. اگر تأیید ایمیل فعال است، صندوق ورودی را چک کنید." }, 201);
    }

    const profile = await getProfile(data.user.id);
    return json(
      {
        user: {
          id: data.user.id,
          email: profile?.email ?? email,
          username: profile?.username ?? username,
          displayName: profile?.displayName ?? displayName,
          role: profile?.role ?? "USER",
        },
      },
      201,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
