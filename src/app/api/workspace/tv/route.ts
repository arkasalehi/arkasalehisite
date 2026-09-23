import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace, isAdminRole } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { sanitizeText } from "@/lib/security";
import { z } from "zod";

export const runtime = "nodejs";

const payload = z.object({
  projectId: z.string().uuid(),
  kind: z.enum(["image", "video", "pdf", "office", "link"]).nullable().optional(),
  url: z.string().max(2000).nullable().optional(),
  title: z.string().max(120).nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireUser();
    if (!canAccessWorkspace(session.role)) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const projectId = new URL(request.url).searchParams.get("projectId");
    if (!projectId) return json({ tv: null });
    const db = await createServerSupabase();
    const { data, error } = await db.from("workspace_projects").select("tv_kind, tv_url, tv_title").eq("id", projectId).maybeSingle();
    if (error || !data) return json({ tv: null });
    if (!data.tv_url) return json({ tv: null });
    return json({
      tv: {
        kind: data.tv_kind ?? "link",
        url: data.tv_url,
        title: data.tv_title ?? "",
      },
    });
  } catch (error) {
    return errorResponse(error, "en");
  }
}

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-tv", 20);
    const session = await requireUser();
    if (!canAccessWorkspace(session.role) || !isAdminRole(session.role)) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const input = payload.parse(await request.json());
    const url = input.url ? sanitizeText(input.url, 2000) : "";
    if (url && !/^https?:\/\//i.test(url)) {
      const error = new Error("INVALID");
      error.name = "INVALID";
      throw error;
    }
    const db = await createServerSupabase();
    const { error } = await db
      .from("workspace_projects")
      .update({
        tv_kind: url ? input.kind ?? "link" : null,
        tv_url: url || null,
        tv_title: url ? sanitizeText(input.title ?? "", 120) : null,
      })
      .eq("id", input.projectId);
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
