import { createServerSupabase } from "@/lib/supabase/server";
import { asCommentStatus, mapCommentUser, toDate } from "./map";
import type { VisibleComment } from "@/lib/types";

function mapComment(row: Record<string, unknown>, replies: VisibleComment["replies"] = []): VisibleComment {
  return {
    id: String(row.id),
    body: String(row.body),
    status: asCommentStatus(row.status),
    postId: String(row.post_id ?? row.postId),
    userId: String(row.user_id ?? row.userId),
    parentId: (row.parent_id ?? row.parentId) ? String(row.parent_id ?? row.parentId) : null,
    createdAt: toDate(row.created_at ?? row.createdAt),
    updatedAt: toDate(row.updated_at ?? row.updatedAt),
    user: mapCommentUser(row.user as Record<string, unknown>),
    replies,
  };
}

export async function listVisibleComments(postId: string) {
  try {
    const db = await createServerSupabase();
    const { data, error } = await db
      .from("comments")
      .select("*, user:profiles!user_id(id, display_name, username, avatar_url)")
      .eq("post_id", postId)
      .eq("status", "VISIBLE")
      .order("created_at", { ascending: true });
    if (error) throw error;
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const mapped = rows.map((row) => mapComment(row, []));
    const byId = new Map(mapped.map((c) => [c.id, c]));
    const roots: VisibleComment[] = [];
    for (const comment of mapped) {
      if (comment.parentId && byId.has(comment.parentId)) {
        byId.get(comment.parentId)!.replies.push(comment);
      } else if (!comment.parentId) {
        roots.push(comment);
      }
    }
    return roots.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error("listVisibleComments", error);
    return [];
  }
}

export async function createComment(input: {
  userId: string;
  postId: string;
  body: string;
  parentId?: string | null;
}) {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("comments")
    .insert({
      user_id: input.userId,
      post_id: input.postId,
      body: input.body.trim(),
      parent_id: input.parentId || null,
    })
    .select("*, user:profiles!user_id(id, display_name, username, avatar_url)")
    .single();
  if (error) throw error;
  return mapComment(data as Record<string, unknown>);
}

export async function getCommentById(id: string) {
  const db = await createServerSupabase();
  const { data, error } = await db.from("comments").select("id, user_id, post_id").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id: String(data.id), userId: String(data.user_id), postId: String(data.post_id) };
}

export async function listAdminComments() {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("comments")
    .select("*, user:profiles!user_id(display_name, email), post:posts(title, slug, type)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const rec = row as Record<string, unknown>;
    const user = (rec.user ?? {}) as Record<string, unknown>;
    const post = (rec.post ?? {}) as Record<string, unknown>;
    return {
      ...mapComment(rec),
      user: {
        displayName: String(user.display_name ?? ""),
        email: String(user.email ?? ""),
      },
      post: {
        title: String(post.title ?? ""),
        slug: String(post.slug ?? ""),
        type: post.type as "BLOG" | "VIDEO" | "SHORT",
      },
    };
  });
}

export async function updateCommentStatus(id: string, status: "VISIBLE" | "HIDDEN" | "SPAM") {
  const db = await createServerSupabase();
  const { error } = await db.from("comments").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteComment(id: string) {
  const db = await createServerSupabase();
  const { error } = await db.from("comments").delete().eq("id", id);
  if (error) throw error;
}
