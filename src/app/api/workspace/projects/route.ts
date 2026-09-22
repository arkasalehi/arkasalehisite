import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { sanitizeText } from "@/lib/security";
import { getActiveTenantId } from "@/lib/data/workspace";
import { z } from "zod";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-projects", 20);
    const session = await requireUser();
    if (!canAccessWorkspace(session.role)) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const input = z.object({ name: z.string().min(1).max(60), identifier: z.string().min(2).max(8).optional() }).parse(await request.json());
    const tenantId = await getActiveTenantId();
    if (!tenantId) throw Object.assign(new Error("NOT_FOUND"), { name: "NOT_FOUND" });
    const db = await createServerSupabase();
    const identifier = sanitizeText((input.identifier ?? input.name).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "PRJ", 8);
    const { data, error } = await db
      .from("workspace_projects")
      .insert({ tenant_id: tenantId, name: sanitizeText(input.name, 60), identifier, created_by: session.id })
      .select("id")
      .single();
    if (error) throw error;
    return json({ id: data.id });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
