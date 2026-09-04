import { createServerSupabase } from "@/lib/supabase/server";
import { mapProfile } from "./map";

const PROFILE_COLUMNS = "id, email, username, display_name, role, avatar_url, bio, created_at, updated_at";

export async function findUserByEmail(email: string) {
  const db = await createServerSupabase();
  const { data, error } = await db.from("profiles").select(PROFILE_COLUMNS).eq("email", email.toLowerCase()).maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data as Record<string, unknown>) : null;
}

export async function findUserByUsername(username: string) {
  const db = await createServerSupabase();
  const { data, error } = await db.from("profiles").select("id").eq("username", username.toLowerCase()).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfile(userId: string) {
  const db = await createServerSupabase();
  const { data, error } = await db.from("profiles").select(PROFILE_COLUMNS).eq("id", userId).maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data as Record<string, unknown>) : null;
}

export async function updateProfile(
  userId: string,
  data: { displayName?: string; bio?: string | null; avatarUrl?: string | null },
) {
  const db = await createServerSupabase();
  const { data: row, error } = await db
    .from("profiles")
    .update({
      display_name: data.displayName,
      bio: data.bio,
      avatar_url: data.avatarUrl,
    })
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .single();
  if (error) throw error;
  return mapProfile(row as Record<string, unknown>);
}

export async function getAdminStats() {
  const db = await createServerSupabase();
  const [users, posts, comments, likes, products, orders, published] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("posts").select("id", { count: "exact", head: true }),
    db.from("comments").select("id", { count: "exact", head: true }),
    db.from("likes").select("id", { count: "exact", head: true }),
    db.from("products").select("id", { count: "exact", head: true }),
    db.from("orders").select("id", { count: "exact", head: true }),
    db.from("posts").select("type, view_count"),
  ]);

  const viewRows = published.data ?? [];
  const views = viewRows.reduce((n, row) => n + Number((row as { view_count?: number }).view_count ?? 0), 0);
  const byTypeMap = new Map<string, number>();
  for (const row of viewRows) {
    const type = String((row as { type?: string }).type ?? "BLOG");
    byTypeMap.set(type, (byTypeMap.get(type) ?? 0) + 1);
  }

  return {
    users: users.count ?? 0,
    posts: posts.count ?? 0,
    comments: comments.count ?? 0,
    likes: likes.count ?? 0,
    products: products.count ?? 0,
    orders: orders.count ?? 0,
    views,
    byType: [...byTypeMap.entries()].map(([type, count]) => ({ type, _count: { _all: count } })),
  };
}
