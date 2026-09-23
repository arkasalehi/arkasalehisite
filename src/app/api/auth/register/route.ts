import { createRouteSupabase, jsonWithCookies } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/auth/roles";
import { identifierTaken, getProfile } from "@/lib/data/users";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { registerSchema } from "@/lib/validators";
import { sanitizeText } from "@/lib/security";
import { publicSiteUrl } from "@/lib/runtime";
import type { CookieOptions } from "@supabase/ssr";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await guardMutation(request, "register", 5);
    const body = registerSchema.parse(await request.json());
    const email = body.email.toLowerCase();
    const username = sanitizeText(body.username, 24).toLowerCase();
    const displayName = sanitizeText(body.displayName, 48);

    const taken = await identifierTaken(email, username);
    if (taken.email) return json({ error: "این ایمیل قبلاً ثبت شده" }, 409);
    if (taken.username) return json({ error: "این نام کاربری گرفته شده" }, 409);

    const jar: Array<{ name: string; value: string; options: CookieOptions }> = [];
    const supabase = createRouteSupabase(request, jar);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: body.password,
      options: {
        data: { username, display_name: displayName },
        emailRedirectTo: `${publicSiteUrl()}/login`,
      },
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered")) {
        return json({ error: "این ایمیل قبلاً ثبت شده" }, 409);
      }
      if (msg.includes("invalid") && msg.includes("email")) {
        return json({ error: "ایمیل نامعتبر است" }, 400);
      }
      if (msg.includes("password")) {
        return json({ error: "رمز عبور پذیرفته نشد" }, 400);
      }
      if (msg.includes("rate limit") || msg.includes("too many")) {
        return json({ error: "درخواست‌های زیاد. کمی بعد تلاش کنید." }, 429);
      }
      if (msg.includes("signups") || msg.includes("disabled")) {
        return json({ error: "ثبت‌نام فعلاً بسته است" }, 403);
      }
      console.error("register signup", error.name);
      return json({ error: "ثبت‌نام انجام نشد" }, 400);
    }
    if (!data.session || !data.user) {
      return json({
        ok: true,
        needsConfirmation: true,
        message: "حساب ساخته شد. لینک تأیید را در ایمیل خود باز کنید و بعد وارد شوید.",
      });
    }

    const profile = await getProfile(data.user.id);
    return jsonWithCookies(
      request,
      {
        user: {
          id: data.user.id,
          email: profile?.email ?? email,
          username: profile?.username ?? username,
          displayName: profile?.displayName ?? displayName,
          role: normalizeRole(profile?.role),
        },
      },
      jar,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
