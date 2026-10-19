import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";

export const runtime = "nodejs";

const MAX_BYTES = 2_500_000;

export async function POST(request: Request) {
  try {
    await guardMutation(request, "admin-media", 20);
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "فایل لازم است" }, 400);
    if (file.size <= 0 || file.size > MAX_BYTES) return json({ error: "حجم تصویر باید کمتر از ۲.۵ مگابایت باشد" }, 400);
    if (file.type !== "image/jpeg" && file.type !== "image/png" && file.type !== "image/webp") {
      return json({ error: "فقط JPEG، PNG یا WebP" }, 400);
    }
    const db = await createServerSupabase();
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `covers/${crypto.randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error } = await db.storage.from("site-media").upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });
    if (error) return json({ error: "آپلود نشد. باکت site-media را از مهاجرت بسازید." }, 503);
    const { data } = db.storage.from("site-media").getPublicUrl(path);
    return json({ url: data.publicUrl });
  } catch (error) {
    return errorResponse(error);
  }
}
