import { errorResponse, guardMutation, json } from "@/lib/http";
import { contactSchema } from "@/lib/validators";
import { sanitizeText } from "@/lib/security";
import { hasSupabaseConfig } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await guardMutation(request, "contact", 5);
    const input = contactSchema.parse(await request.json());
    if (input.company) return json({ ok: true });
    if (!hasSupabaseConfig()) return json({ error: "فرم تماس هنوز به دیتابیس وصل نیست." }, 503);
    const db = await createServerSupabase();
    const { error } = await db.rpc("submit_contact_message", {
      p_name: sanitizeText(input.name, 80),
      p_email: sanitizeText(input.email, 180),
      p_message: sanitizeText(input.message, 4000),
    });
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("rate")) return json({ error: "درخواست‌های زیاد. کمی بعد تلاش کنید." }, 429);
      if (message.includes("invalid") || message.includes("submit_contact_message")) {
        return json({ error: "پیام ذخیره نشد. مهاجرت دیتابیس را اعمال کنید." }, 503);
      }
      throw error;
    }
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
