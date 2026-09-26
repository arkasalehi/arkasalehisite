import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { getActiveTenantId } from "@/lib/data/workspace";
import { routeTimer } from "@/lib/timing";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const done = routeTimer("POST /api/workspace/files");
  try {
    await guardMutation(request, "workspace-files", 20);
    const session = await requireUser();
    if (!canAccessWorkspace(session.role)) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const input = (await request.json()) as { name?: string; size?: number; type?: string };
    const name = String(input.name ?? "file").slice(0, 80);
    const size = Number(input.size ?? 0);
    if (!Number.isFinite(size) || size < 1 || size > MAX_BYTES) {
      const error = new Error("INVALID");
      error.name = "INVALID";
      throw error;
    }
    const tenantId = (await getActiveTenantId()) ?? "shared";
    const safe = name.replace(/[^\w.\-]+/g, "_").slice(0, 80);
    const path = `${tenantId}/${session.id}/${crypto.randomUUID()}-${safe}`;
    const db = await createServerSupabase();
    const { data, error } = await db.storage.from("workspace").createSignedUploadUrl(path);
    if (error || !data) throw error ?? new Error("upload");
    const publicUrl = db.storage.from("workspace").getPublicUrl(path).data.publicUrl;
    return json({ path, token: data.token, url: publicUrl, name });
  } catch (error) {
    return errorResponse(error, "en");
  } finally {
    done();
  }
}
