import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { sanitizeText } from "@/lib/security";
import { withAppCookieOptions } from "@/lib/auth/cookies";
import { z } from "zod";
import { getActiveTenantId, listTenants } from "@/lib/data/workspace";

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

export async function GET() {
  try {
    const session = await requireWorkspace();
    const tenants = await listTenants(session.id);
    const active = await getActiveTenantId();
    return json({ tenants, active });
  } catch (error) {
    return errorResponse(error, "en");
  }
}

export async function POST(request: Request) {
  try {
    await guardMutation(request, "workspace-tenants", 20);
    const session = await requireWorkspace();
    const input = z
      .object({
        name: z.string().min(2).max(60).optional(),
        switchTo: z.string().uuid().optional(),
        inviteEmail: z.string().email().optional(),
      })
      .parse(await request.json());
    const db = await createServerSupabase();
    const host = request.headers.get("host") ?? undefined;

    if (input.switchTo) {
      const jar = await cookies();
      jar.set("arka_tenant", input.switchTo, withAppCookieOptions({ path: "/", maxAge: 60 * 60 * 24 * 365 }, host));
      return json({ ok: true, active: input.switchTo });
    }

    if (input.inviteEmail) {
      const tenantId = await getActiveTenantId();
      if (!tenantId) throw Object.assign(new Error("NOT_FOUND"), { name: "NOT_FOUND" });
      const { data: profile } = await db.from("profiles").select("id").eq("email", input.inviteEmail).maybeSingle();
      if (profile?.id) {
        await db.from("workspace_tenant_members").insert({ tenant_id: tenantId, user_id: profile.id, role: "member" });
      } else {
        await db.from("workspace_invites").insert({ tenant_id: tenantId, email: input.inviteEmail, created_by: session.id });
      }
      return json({ ok: true });
    }

    const name = sanitizeText(input.name ?? "Workspace", 60);
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24)}-${crypto.randomUUID().slice(0, 6)}`;
    const { data, error } = await db.from("workspace_tenants").insert({ name, slug, created_by: session.id }).select("id").single();
    if (error) throw error;
    await db.from("workspace_tenant_members").insert({ tenant_id: data.id, user_id: session.id, role: "owner" });
    await db.from("workspace_projects").insert({ tenant_id: data.id, name: "Studio", identifier: "ARKA", created_by: session.id });
    const jar = await cookies();
    jar.set("arka_tenant", String(data.id), withAppCookieOptions({ path: "/", maxAge: 60 * 60 * 24 * 365 }, host));
    return json({ id: data.id });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
