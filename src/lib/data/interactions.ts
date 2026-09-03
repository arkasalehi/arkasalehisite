import { createServerSupabase } from "@/lib/supabase/server";
import { mapPost, toDate } from "./map";
import type { PostType } from "@/lib/types";

export async function toggleLike(userId: string, postId: string) {
  const db = await createServerSupabase();
  const { data: existing } = await db.from("likes").select("id").eq("user_id", userId).eq("post_id", postId).maybeSingle();
  if (existing) {
    await db.from("likes").delete().eq("id", existing.id);
  } else {
    const { error } = await db.from("likes").insert({ user_id: userId, post_id: postId });
    if (error) throw error;
  }
  const { count } = await db.from("likes").select("id", { count: "exact", head: true }).eq("post_id", postId);
  return { liked: !existing, count: count ?? 0 };
}

export async function toggleBookmark(userId: string, postId: string) {
  const db = await createServerSupabase();
  const { data: existing } = await db
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .maybeSingle();
  if (existing) {
    await db.from("bookmarks").delete().eq("id", existing.id);
  } else {
    const { error } = await db.from("bookmarks").insert({ user_id: userId, post_id: postId });
    if (error) throw error;
  }
  const { count } = await db.from("bookmarks").select("id", { count: "exact", head: true }).eq("post_id", postId);
  return { saved: !existing, count: count ?? 0 };
}

export async function getUserPostState(userId: string | undefined, postId: string) {
  if (!userId) return { liked: false, saved: false };
  const db = await createServerSupabase();
  const [like, bookmark] = await Promise.all([
    db.from("likes").select("id").eq("user_id", userId).eq("post_id", postId).maybeSingle(),
    db.from("bookmarks").select("id").eq("user_id", userId).eq("post_id", postId).maybeSingle(),
  ]);
  return { liked: Boolean(like.data), saved: Boolean(bookmark.data) };
}

export async function listSavedPosts(userId: string) {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("bookmarks")
    .select(
      "id, created_at, post:posts(*, category:categories(*), author:profiles!author_id(display_name, username, avatar_url), likes(count), comments(count))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).flatMap((row) => {
    const rec = row as Record<string, unknown>;
    if (!rec.post || typeof rec.post !== "object") return [];
    return [
      {
        id: String(rec.id),
        createdAt: toDate(rec.created_at),
        post: mapPost(rec.post as Record<string, unknown>),
      },
    ];
  });
}

export async function listUserActivity(userId: string) {
  const db = await createServerSupabase();
  const postLite = "post:posts(title, slug, type)";
  const [likes, comments, bookmarks] = await Promise.all([
    db.from("likes").select(`id, created_at, ${postLite}`).eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    db.from("comments").select(`id, body, created_at, ${postLite}`).eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    db.from("bookmarks").select(`id, created_at, ${postLite}`).eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
  ]);

  const mapActivity = (rows: Array<Record<string, unknown>> | null) =>
    (rows ?? []).flatMap((row) => {
      const post = row.post as Record<string, unknown> | null;
      if (!post) return [];
      return [
        {
          id: String(row.id),
          body: row.body ? String(row.body) : undefined,
          createdAt: toDate(row.created_at),
          post: {
            title: String(post.title),
            slug: String(post.slug),
            type: post.type as PostType,
          },
        },
      ];
    });

  return {
    likes: mapActivity((likes.data ?? []) as Array<Record<string, unknown>>),
    comments: mapActivity((comments.data ?? []) as Array<Record<string, unknown>>),
    bookmarks: mapActivity((bookmarks.data ?? []) as Array<Record<string, unknown>>),
  };
}
