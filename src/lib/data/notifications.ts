import type { NotificationType } from "@/lib/types";
import { createServerSupabase } from "@/lib/supabase/server";
import { mapNotification } from "./map";

export async function listNotifications(userId: string, take = 30) {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(take);
  if (error) throw error;
  return (data ?? []).map((row) => mapNotification(row as Record<string, unknown>));
}

export async function unreadCount(userId: string) {
  const db = await createServerSupabase();
  const { count, error } = await db
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  const db = await createServerSupabase();
  let q = db.from("notifications").update({ read: true }).eq("user_id", userId);
  if (ids?.length) q = q.in("id", ids);
  else q = q.eq("read", false);
  const { error } = await q;
  if (error) throw error;
}

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  actorId?: string;
  postId?: string;
}) {
  const db = await createServerSupabase();
  const { error } = await db.rpc("notify_user", {
    p_user_id: input.userId,
    p_type: input.type,
    p_title: input.title,
    p_body: input.body ?? null,
    p_link: input.link ?? null,
    p_actor_id: input.actorId ?? null,
    p_post_id: input.postId ?? null,
  });
  if (error) throw error;
}

export async function notifyAdmins(input: {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  actorId?: string;
  postId?: string;
}) {
  const db = await createServerSupabase();
  const { error } = await db.rpc("notify_admins", {
    p_type: input.type,
    p_title: input.title,
    p_body: input.body ?? null,
    p_link: input.link ?? null,
    p_actor_id: input.actorId ?? null,
    p_post_id: input.postId ?? null,
  });
  if (error) throw error;
}

export async function notifyAllUsers(input: {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  postId?: string;
}) {
  const db = await createServerSupabase();
  const { error } = await db.rpc("notify_all_users", {
    p_type: input.type,
    p_title: input.title,
    p_body: input.body ?? null,
    p_link: input.link ?? null,
    p_post_id: input.postId ?? null,
  });
  if (error) throw error;
}
