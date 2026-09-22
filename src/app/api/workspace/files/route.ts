import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { getActiveTenantId } from "@/lib/data/workspace";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-files", 20);
    const session = await requireUser();
    if (!canAccessWorkspace(session.role)) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size < 1) {
      const error = new Error("INVALID");
      error.name = "INVALID";
      throw error;
    }
    if (file.size > 20 * 1024 * 1024) {
      const error = new Error("INVALID");
      error.name = "INVALID";
      throw error;
    }
    const tenantId = (await getActiveTenantId()) ?? "shared";
    const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80);
    const path = `${tenantId}/${session.id}/${crypto.randomUUID()}-${safe}`;
    const db = await createServerSupabase();
    const buf = Buffer.from(await file.arrayBuffer());
    const { error } = await db.storage.from("workspace").upload(path, buf, { contentType: file.type || "application/octet-stream", upsert: false });
    if (error) throw error;
    const { data } = db.storage.from("workspace").getPublicUrl(path);
    return json({ url: data.publicUrl, name: file.name, path });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
