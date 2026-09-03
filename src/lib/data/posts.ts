import { cache } from "react";
import type { PostStatus, PostType, PublicPost } from "@/lib/types";
import { canQueryDatabase } from "./client";
import { readingTimeFromBody } from "@/lib/utils";
import { cached, invalidateCache } from "@/lib/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { POST_SELECT, mapCategory, mapPost } from "./map";

export type { PublicPost };

const nowIso = () => new Date().toISOString();

function applyPublished<T>(query: T): T {
  const now = nowIso();
  const q = query as {
    eq: (c: string, v: string) => { or: (f: string) => { or: (f: string) => T } };
  };
  return q
    .eq("status", "PUBLISHED")
    .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
    .or(`published_at.is.null,published_at.lte.${now}`);
}

export type PostListOpts = {
  type?: PostType;
  categorySlug?: string;
  take?: number;
  skip?: number;
  featured?: boolean;
  sort?: "latest" | "popular";
};

export const listPublishedPosts = cache(async (opts?: PostListOpts) => {
  const key = `posts:${JSON.stringify(opts ?? {})}`;
  return cached(key, 15_000, async () => {
    if (!canQueryDatabase()) return [];
    try {
      const db = await createServerSupabase();
      let q = applyPublished(db.from("posts").select(POST_SELECT));
      if (opts?.type) q = q.eq("type", opts.type);
      if (opts?.featured) q = q.eq("featured", true);
      if (opts?.categorySlug) {
        const { data: cat } = await db.from("categories").select("id").eq("slug", opts.categorySlug).maybeSingle();
        if (!cat) return [];
        q = q.eq("category_id", cat.id);
      }
      q =
        opts?.sort === "popular"
          ? q.order("view_count", { ascending: false }).order("published_at", { ascending: false })
          : q.order("featured", { ascending: false }).order("published_at", { ascending: false });
      const { data, error } = await q.range(opts?.skip ?? 0, (opts?.skip ?? 0) + (opts?.take ?? 24) - 1);
      if (error) throw error;
      return (data ?? []).map((row) => mapPost(row as Record<string, unknown>));
    } catch (error) {
      console.error("listPublishedPosts", error);
      return [];
    }
  });
});

function sanitizeSearch(q: string) {
  return q.replace(/[%_,()]/g, " ").trim().slice(0, 80);
}

export const searchPublishedPosts = cache(async (q: string, take = 8) => {
  const query = sanitizeSearch(q);
  if (query.length < 2) return [];
  return cached(`search:${query}:${take}`, 10_000, async () => {
    try {
      const db = await createServerSupabase();
      const like = `%${query}%`;
      const { data, error } = await applyPublished(db.from("posts").select("id, title, slug, type, excerpt, cover_image"))
        .or(`title.ilike."${like}",excerpt.ilike."${like}",body.ilike."${like}"`)
        .order("published_at", { ascending: false })
        .limit(take);
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: String(row.id),
        title: String(row.title),
        slug: String(row.slug),
        type: row.type as PostType,
        excerpt: row.excerpt as string | null,
        coverImage: (row.cover_image as string | null) ?? null,
      }));
    } catch (error) {
      console.error("searchPublishedPosts", error);
      return [];
    }
  });
});

export const getPublishedPostBySlug = cache(async (slug: string, type?: PostType) => {
  if (!canQueryDatabase()) return null;
  try {
    const db = await createServerSupabase();
    let q = applyPublished(db.from("posts").select(POST_SELECT)).eq("slug", slug);
    if (type) q = q.eq("type", type);
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return data ? mapPost(data as Record<string, unknown>) : null;
  } catch (error) {
    console.error("getPublishedPostBySlug", error);
    return null;
  }
});

export const getPostBySlugAny = cache(async (slug: string) => {
  try {
    const db = await createServerSupabase();
    const { data, error } = await db.from("posts").select(POST_SELECT).eq("slug", slug).maybeSingle();
    if (error) throw error;
    return data ? mapPost(data as Record<string, unknown>) : null;
  } catch (error) {
    console.error("getPostBySlugAny", error);
    return null;
  }
});

export async function getPostsBySlugs(slugs: string[]) {
  if (!slugs.length) return [];
  try {
    const db = await createServerSupabase();
    const { data, error } = await applyPublished(db.from("posts").select(POST_SELECT)).in("slug", slugs);
    if (error) throw error;
    const map = new Map((data ?? []).map((row) => {
      const post = mapPost(row as Record<string, unknown>);
      return [post.slug, post] as const;
    }));
    return slugs.map((s) => map.get(s)).filter((p): p is PublicPost => Boolean(p));
  } catch (error) {
    console.error("getPostsBySlugs", error);
    return [];
  }
}

export async function listPublishedSlugs(type?: PostType) {
  if (!canQueryDatabase()) return [];
  try {
    const db = await createServerSupabase();
    let q = applyPublished(db.from("posts").select("slug, type, updated_at"));
    if (type) q = q.eq("type", type);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((row) => ({
      slug: String(row.slug),
      type: row.type as PostType,
      updatedAt: new Date(String(row.updated_at)),
    }));
  } catch (error) {
    console.error("listPublishedSlugs", error);
    return [];
  }
}

export async function incrementPostViews(id: string) {
  try {
    const db = await createServerSupabase();
    await db.rpc("increment_post_views", { p_id: id });
  } catch (error) {
    console.error("incrementPostViews", error);
  }
}

export async function listCategories() {
  try {
    const db = await createServerSupabase();
    const { data, error } = await db.from("categories").select("*, posts(count)").order("name");
    if (error) throw error;
    return (data ?? []).map((row) => mapCategory(row as Record<string, unknown>));
  } catch (error) {
    console.error("listCategories", error);
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const db = await createServerSupabase();
    const { data, error } = await db.from("categories").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return data ? mapCategory(data as Record<string, unknown>) : null;
  } catch (error) {
    console.error("getCategoryBySlug", error);
    return null;
  }
}

export async function listAdminPosts() {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("posts")
    .select("*, category:categories(*), likes(count), comments(count)")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapPost(row as Record<string, unknown>));
}

export async function getPostById(id: string) {
  const db = await createServerSupabase();
  const { data, error } = await db.from("posts").select(POST_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapPost(data as Record<string, unknown>) : null;
}

export async function getPostMeta(id: string) {
  const db = await createServerSupabase();
  const { data, error } = await db.from("posts").select("id, title, slug, type, author_id").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: String(data.id),
    title: String(data.title),
    slug: String(data.slug),
    type: data.type as PostType,
    authorId: String(data.author_id),
  };
}

export async function upsertPost(
  authorId: string,
  data: {
    id?: string;
    type: PostType;
    status: PostStatus;
    title: string;
    slug: string;
    excerpt?: string | null;
    body?: string | null;
    coverImage?: string | null;
    videoUrl?: string | null;
    thumbnailUrl?: string | null;
    duration?: number | null;
    categoryId?: string | null;
    featured?: boolean;
    scheduledAt?: string | Date | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    productIds?: string[];
  },
) {
  const db = await createServerSupabase();
  const emptyToNull = (v?: string | null) => (v ? v : null);
  const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt).toISOString() : null;
  const payload = {
    type: data.type,
    status: data.status,
    title: data.title,
    slug: data.slug,
    excerpt: emptyToNull(data.excerpt),
    body: emptyToNull(data.body),
    cover_image: emptyToNull(data.coverImage),
    video_url: emptyToNull(data.videoUrl),
    thumbnail_url: emptyToNull(data.thumbnailUrl),
    duration: data.duration ?? null,
    category_id: emptyToNull(data.categoryId),
    seo_title: emptyToNull(data.seoTitle),
    seo_description: emptyToNull(data.seoDescription),
    reading_time: readingTimeFromBody(data.body),
    featured: data.featured ?? false,
    scheduled_at: scheduledAt,
    author_id: authorId,
  };

  let id = data.id;
  if (id) {
    const existing = await getPostById(id);
    const publishedAt =
      data.status === "PUBLISHED" ? scheduledAt ?? existing?.publishedAt?.toISOString() ?? nowIso() : null;
    const { error } = await db.from("posts").update({ ...payload, published_at: publishedAt }).eq("id", id);
    if (error) throw error;
    await db.from("post_products").delete().eq("post_id", id);
  } else {
    const publishedAt = data.status === "PUBLISHED" ? scheduledAt ?? nowIso() : null;
    const { data: created, error } = await db
      .from("posts")
      .insert({ ...payload, published_at: publishedAt })
      .select("id")
      .single();
    if (error) throw error;
    id = String(created.id);
  }

  const productIds = data.productIds ?? [];
  if (productIds.length) {
    const { error } = await db.from("post_products").insert(productIds.map((productId) => ({ post_id: id, product_id: productId })));
    if (error) throw error;
  }

  invalidateCache("posts:");
  invalidateCache("search:");
  return id!;
}

export async function deletePost(id: string) {
  const db = await createServerSupabase();
  const { error } = await db.from("posts").delete().eq("id", id);
  if (error) throw error;
  invalidateCache("posts:");
  invalidateCache("search:");
}

export async function bulkPosts(ids: string[], action: "delete" | "publish" | "draft") {
  const db = await createServerSupabase();
  if (action === "delete") {
    const { error } = await db.from("posts").delete().in("id", ids);
    if (error) throw error;
  } else {
    const { error } = await db
      .from("posts")
      .update(
        action === "publish"
          ? { status: "PUBLISHED", published_at: nowIso(), scheduled_at: null }
          : { status: "DRAFT" },
      )
      .in("id", ids);
    if (error) throw error;
  }
  invalidateCache("posts:");
  invalidateCache("search:");
}

export async function getRelatedPosts(post: { id: string; type: PostType; categoryId: string | null }) {
  try {
    const db = await createServerSupabase();
    const { data, error } = await applyPublished(db.from("posts").select(POST_SELECT))
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(8);
    if (error) throw error;
    const mapped = (data ?? []).map((row) => mapPost(row as Record<string, unknown>));
    const ranked = mapped.sort((a, b) => {
      const as = Number(a.categoryId === post.categoryId) + Number(a.type === post.type);
      const bs = Number(b.categoryId === post.categoryId) + Number(b.type === post.type);
      return bs - as;
    });
    return ranked.slice(0, 3);
  } catch (error) {
    console.error("getRelatedPosts", error);
    return [];
  }
}

export async function getContentAnalytics() {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("posts")
    .select("id, title, slug, type, view_count, likes(count), comments(count)")
    .eq("status", "PUBLISHED");
  if (error) throw error;
  const rows = (data ?? []).map((row) => mapPost({ ...row, author: null, post_products: [], bookmarks: [] } as Record<string, unknown>));
  const byViews = [...rows].sort((a, b) => b.viewCount - a.viewCount).slice(0, 8);
  const byLikes = [...rows].sort((a, b) => b._count.likes - a._count.likes).slice(0, 8);
  const viewSum = rows.reduce((n, p) => n + p.viewCount, 0);
  return {
    byViews,
    byLikes,
    totals: {
      _sum: { viewCount: viewSum },
      _avg: { viewCount: rows.length ? viewSum / rows.length : 0 },
      _count: rows.length,
    },
  };
}

