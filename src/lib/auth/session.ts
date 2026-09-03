import type { Role } from "@/lib/types";
import { createServerSupabase } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data/users";

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: Role;
};

export async function getSession(): Promise<SessionUser | null> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const profile = await getProfile(user.id);
    if (!profile) {
      return {
        id: user.id,
        email: user.email ?? "",
        username: String(user.user_metadata?.username ?? ""),
        displayName: String(user.user_metadata?.display_name ?? user.email ?? ""),
        role: "USER",
      };
    }
    return {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      displayName: profile.displayName,
      role: profile.role,
    };
  } catch (error) {
    console.error("getSession", error);
    return null;
  }
}

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
  if (session.role !== "ADMIN") {
    const error = new Error("FORBIDDEN");
    error.name = "FORBIDDEN";
    throw error;
  }
  return session;
}

export async function clearSessionCookie() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
}
