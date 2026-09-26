import { createServerSupabase } from "@/lib/supabase/server";
import { mapProfile } from "./map";

const PROFILE_COLUMNS = "id, email, username, display_name, role, avatar_url, bio, created_at, updated_at";
const PUBLIC_PROFILE_COLUMNS = "id, username, display_name, avatar_url, bio";

export async function identifierTaken(email: string, username?: string | null) {
  const db = await createServerSupabase();
  const { data, error } = await db.rpc("identifier_taken", {
    p_email: email,
    p_username: username?.trim() ? username.trim().toLowerCase() : null,
  });
  if (!error && data && typeof data === "object") {
    const row = data as { email?: boolean; username?: boolean };
    return { email: Boolean(row.email), username: Boolean(row.username) };
  }
  const existingUser = username ? await findUserByUsername(username) : null;
  return { email: false, username: Boolean(existingUser) };
}

export async function findUserByEmail(email: string) {
  const taken = await identifierTaken(email);
  return taken.email;
}

export async function findUserByUsername(username: string) {
  const db = await createServerSupabase();
  const { data, error } = await db.from("profiles").select("id").eq("username", username.toLowerCase()).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfile(userId: string) {
  const db = await createServerSupabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (user?.id === userId) {
    const { data, error } = await db.rpc("my_profile");
    if (!error && data && typeof data === "object") {
      return mapProfile(data as Record<string, unknown>);
    }
    const { data: own, error: ownError } = await db.from("profiles").select(PROFILE_COLUMNS).eq("id", userId).maybeSingle();
    if (!ownError && own) return mapProfile(own as Record<string, unknown>);
  }
  const { data, error } = await db.from("profiles").select(PUBLIC_PROFILE_COLUMNS).eq("id", userId).maybeSingle();
  if (error) {
    console.error("getProfile", error);
    return null;
  }
  return data ? mapProfile(data as Record<string, unknown>) : null;
}

export async function updateProfile(
  userId: string,
  data: { displayName?: string; username?: string; bio?: string | null; avatarUrl?: string | null },
) {
  const db = await createServerSupabase();
  if (data.username) {
    const existing = await findUserByUsername(data.username);
    if (existing && String(existing.id) !== userId) {
      const err = new Error("USERNAME_TAKEN");
      err.name = "CONFLICT";
      throw err;
    }
  }
  const patch: Record<string, string | null> = {};
  if (data.displayName !== undefined) patch.display_name = data.displayName;
  if (data.username !== undefined) patch.username = data.username.toLowerCase();
  if (data.bio !== undefined) patch.bio = data.bio;
  if (data.avatarUrl !== undefined) patch.avatar_url = data.avatarUrl;
  const { error } = await db.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
  if (data.username || data.displayName) {
    await db.auth.updateUser({
      data: {
        ...(data.username ? { username: data.username.toLowerCase() } : {}),
        ...(data.displayName ? { display_name: data.displayName } : {}),
      },
    });
  }
  const profile = await getProfile(userId);
  if (!profile) throw new Error("NOT_FOUND");
  return profile;
}

export async function getAdminStats() {
  const db = await createServerSupabase();
  const [users, posts, comments, likes, products, orders, viewsAgg] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("posts").select("id", { count: "exact", head: true }),
    db.from("comments").select("id", { count: "exact", head: true }),
    db.from("likes").select("id", { count: "exact", head: true }),
    db.from("products").select("id", { count: "exact", head: true }),
    db.from("orders").select("id", { count: "exact", head: true }),
    db.from("posts").select("view_count.sum()"),
  ]);

  const viewsRaw = (viewsAgg.data ?? []) as Array<Record<string, unknown>>;
  const first = viewsRaw[0] ?? {};
  const views = Number(first.sum ?? first.view_count ?? 0);

  return {
    users: users.count ?? 0,
    posts: posts.count ?? 0,
    comments: comments.count ?? 0,
    likes: likes.count ?? 0,
    products: products.count ?? 0,
    orders: orders.count ?? 0,
    views,
    byType: [] as Array<{ type: string; _count: { _all: number } }>,
  };
}
