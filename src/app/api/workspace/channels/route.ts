import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { sanitizeText } from "@/lib/security";
import { getActiveTenantId } from "@/lib/data/workspace";
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

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-channels", 20);
    const session = await requireWorkspace();
    const input = z
      .object({
        name: z.string().min(1).max(60).optional(),
        kind: z.enum(["channel", "private", "dm"]).optional(),
        withUserId: z.string().uuid().optional(),
      })
      .parse(await request.json());
    const db = await createServerSupabase();
    const tenantId = await getActiveTenantId();
    if (input.kind === "dm" && input.withUserId) {
      const [a, b] = [session.id, input.withUserId].sort();
      const slug = `dm-${a.slice(0, 8)}-${b.slice(0, 8)}`;
      const existing = await db.from("workspace_channels").select("id").eq("slug", slug).maybeSingle();
      if (existing.data?.id) return json({ id: existing.data.id });
      const { data, error } = await db
        .from("workspace_channels")
        .insert({ slug, name: "Direct", kind: "dm", tenant_id: tenantId })
        .select("id")
        .single();
      if (error) throw error;
      await db.from("workspace_channel_members").insert([
        { channel_id: data.id, user_id: session.id },
        { channel_id: data.id, user_id: input.withUserId },
      ]);
      return json({ id: data.id });
    }
    const name = sanitizeText(input.name ?? "channel", 60);
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 32)}-${crypto.randomUUID().slice(0, 4)}`;
    const kind = input.kind === "private" ? "private" : "channel";
    const { data, error } = await db.from("workspace_channels").insert({ slug, name, kind, tenant_id: tenantId }).select("id").single();
    if (error) throw error;
    await db.from("workspace_channel_members").insert({ channel_id: data.id, user_id: session.id });
    return json({ id: data.id });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
