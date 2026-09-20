import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { forgotPasswordSchema } from "@/lib/validators";
import { publicSiteUrl } from "@/lib/runtime";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await guardMutation(request, "forgot-password", 4);
    const body = forgotPasswordSchema.parse(await request.json());
    const supabase = await createServerSupabase();
    await supabase.auth.resetPasswordForEmail(body.email.toLowerCase(), {
      redirectTo: `${publicSiteUrl()}/update-password`,
    });
    return json({
      ok: true,
      message: "اگر این ایمیل ثبت شده باشد، لینک بازیابی ارسال می‌شود.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
