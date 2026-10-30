import { cache } from "react";
import { cookies } from "next/headers";
import type { Role } from "@/lib/types";
import { isAdminRole, normalizeRole } from "@/lib/auth/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { hasSupabaseAuthCookie } from "@/lib/supabase/fetch";
import { getProfile } from "@/lib/data/users";

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: Role;
  avatarUrl: string | null;
  /** Owner / top-level admin. Regular `admin` is not enough. */
  isSuperAdmin: boolean;
};

export const getSession = cache(async (): Promise<SessionUser | null> => {
  try {
    const jar = await cookies();
    if (!hasSupabaseAuthCookie(jar.getAll())) return null;
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const [{ data: superFlag, error: superError }, profile] = await Promise.all([
      supabase.rpc("is_super_admin"),
      getProfile(user.id),
    ]);
    const isSuperAdmin = !superError && superFlag === true;
    if (!profile) {
      return {
        id: user.id,
        email: user.email ?? "",
        username: String(user.user_metadata?.username ?? ""),
        displayName: String(user.user_metadata?.display_name ?? user.email ?? ""),
        role: "user",
        avatarUrl: null,
        isSuperAdmin,
      };
    }
    return {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      displayName: profile.displayName,
      role: normalizeRole(profile.role),
      avatarUrl: profile.avatarUrl,
      isSuperAdmin,
    };
  } catch (error) {
    console.error("getSession", error);
    return null;
  }
});

export async function requireUser() {
  const session = await getSession();
  if (!session) {
    const error = new Error("UNAUTHORIZED");
    error.name = "UNAUTHORIZED";
    throw error;
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("is_admin");
  if (error || data !== true || !isAdminRole(session.role)) {
    const denied = new Error("FORBIDDEN");
    denied.name = "FORBIDDEN";
    throw denied;
  }
  return session;
}

/** Page gate. Role comes from is_admin() in the database, not from a form field. */
export async function requireAdminPage() {
  const { redirect } = await import("next/navigation");
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.rpc("is_admin");
    if (error || data !== true) redirect("/");
  } catch {
    redirect("/");
  }
  return session;
}

export async function clearSessionCookie() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
}
