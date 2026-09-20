import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { sanitizeText } from "@/lib/security";
import { z } from "zod";

export const runtime = "nodejs";

async function requireWorkspace() {
  const session = await requireUser();
  if (!canAccessWorkspace(session.role)) {
    const error = new Error("FORBIDDEN");
    error.name = "FORBIDDEN";
    throw error;
  }
  return session;
}

const schema = z.object({
  title: z.string().min(1).max(80),
  color: z.enum(["lilac", "cream", "mint", "sky"]).optional(),
});

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-notes", 30);
    const session = await requireWorkspace();
    const input = schema.parse(await request.json());
    const db = await createServerSupabase();
    const { data, error } = await db
      .from("workspace_notes")
      .insert({ title: sanitizeText(input.title, 80), color: input.color ?? "lilac", created_by: session.id })
      .select("id")
      .single();
    if (error) throw error;
    return json({ id: data.id });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
