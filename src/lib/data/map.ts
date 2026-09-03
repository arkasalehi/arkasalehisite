import type { Category, CommentStatus, CommentUser, Notification, PostStatus, PostType, Product, Profile, PublicPost, Role } from "@/lib/types";

export function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return new Date();
}

export function toDateOrNull(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const date = toDate(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function countOf(value: unknown): number {
  if (typeof value === "number") return value;
  if (Array.isArray(value) && value[0] && typeof (value[0] as { count?: unknown }).count === "number") {
    return (value[0] as { count: number }).count;
  }
  return 0;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function strOrNull(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function numOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: str(row.id),
    email: str(row.email),
    username: str(row.username),
    displayName: str(row.display_name ?? row.displayName),
    role: row.role === "ADMIN" ? "ADMIN" : "USER",
    avatarUrl: strOrNull(row.avatar_url ?? row.avatarUrl),
    bio: strOrNull(row.bio),
    createdAt: toDate(row.created_at ?? row.createdAt),
    updatedAt: toDate(row.updated_at ?? row.updatedAt),
  };
}

export function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: str(row.id),
    title: str(row.title),
    slug: str(row.slug),
    description: strOrNull(row.description),
    price: Number(row.price ?? 0),
    comparePrice: numOrNull(row.compare_price ?? row.comparePrice),
    discountPercent: Number(row.discount_percent ?? row.discountPercent ?? 0),
    stock: Number(row.stock ?? 0),
    imageUrl: strOrNull(row.image_url ?? row.imageUrl),
    inStock: Boolean(row.in_stock ?? row.inStock),
    sku: strOrNull(row.sku),
    featured: Boolean(row.featured),
    createdAt: toDate(row.created_at ?? row.createdAt),
    updatedAt: toDate(row.updated_at ?? row.updatedAt),
  };
}

export function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: str(row.id),
    name: str(row.name),
    slug: str(row.slug),
    description: strOrNull(row.description),
    _count: { posts: countOf(row.posts) },
  };
}

function mapAuthor(row: Record<string, unknown> | null | undefined): PublicPost["author"] {
  if (!row) return { id: "", displayName: "", username: "", avatarUrl: null };
  return {
    id: str(row.id),
    displayName: str(row.display_name ?? row.displayName),
    username: str(row.username),
    avatarUrl: strOrNull(row.avatar_url ?? row.avatarUrl),
  };
}

export function mapPost(row: Record<string, unknown>): PublicPost {
  const productsRaw = Array.isArray(row.post_products) ? row.post_products : Array.isArray(row.products) ? row.products : [];
  return {
    id: str(row.id),
    type: (row.type as PostType) ?? "BLOG",
    status: (row.status as PostStatus) ?? "DRAFT",
    title: str(row.title),
    slug: str(row.slug),
    excerpt: strOrNull(row.excerpt),
    body: strOrNull(row.body),
    coverImage: strOrNull(row.cover_image ?? row.coverImage),
    videoUrl: strOrNull(row.video_url ?? row.videoUrl),
    thumbnailUrl: strOrNull(row.thumbnail_url ?? row.thumbnailUrl),
    duration: numOrNull(row.duration),
    readingTime: numOrNull(row.reading_time ?? row.readingTime),
    seoTitle: strOrNull(row.seo_title ?? row.seoTitle),
    seoDescription: strOrNull(row.seo_description ?? row.seoDescription),
    featured: Boolean(row.featured),
    scheduledAt: toDateOrNull(row.scheduled_at ?? row.scheduledAt),
    publishedAt: toDateOrNull(row.published_at ?? row.publishedAt),
    viewCount: Number(row.view_count ?? row.viewCount ?? 0),
    categoryId: strOrNull(row.category_id ?? row.categoryId),
    authorId: str(row.author_id ?? row.authorId),
    createdAt: toDate(row.created_at ?? row.createdAt),
    updatedAt: toDate(row.updated_at ?? row.updatedAt),
    category: row.category && typeof row.category === "object" ? mapCategory(row.category as Record<string, unknown>) : null,
    author: mapAuthor(row.author as Record<string, unknown> | null),
    products: (productsRaw as Array<Record<string, unknown>>).flatMap((item) => {
      const productRow = (item.product ?? item.products) as Record<string, unknown> | undefined;
      if (!productRow) return [];
      const product = mapProduct(productRow);
      return [{ postId: str(item.post_id ?? item.postId ?? row.id), productId: product.id, product }];
    }),
    _count: {
      likes: countOf(row.likes),
      comments: countOf(row.comments),
      bookmarks: countOf(row.bookmarks),
    },
  };
}

export function mapCommentUser(row: Record<string, unknown> | null | undefined): CommentUser {
  if (!row) return { id: "", displayName: "", username: "", avatarUrl: null };
  return {
    id: str(row.id),
    displayName: str(row.display_name ?? row.displayName),
    username: str(row.username),
    avatarUrl: strOrNull(row.avatar_url ?? row.avatarUrl),
  };
}

export function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: str(row.id),
    userId: str(row.user_id ?? row.userId),
    type: row.type as Notification["type"],
    title: str(row.title),
    body: strOrNull(row.body),
    link: strOrNull(row.link),
    read: Boolean(row.read),
    actorId: strOrNull(row.actor_id ?? row.actorId),
    postId: strOrNull(row.post_id ?? row.postId),
    groupKey: strOrNull(row.group_key ?? row.groupKey),
    count: Number(row.count ?? 1),
    createdAt: toDate(row.created_at ?? row.createdAt),
  };
}

export function asRole(value: unknown): Role {
  return value === "ADMIN" ? "ADMIN" : "USER";
}

export function asCommentStatus(value: unknown): CommentStatus {
  if (value === "HIDDEN" || value === "SPAM") return value;
  return "VISIBLE";
}

export const POST_SELECT =
  "*, category:categories(*), author:profiles!author_id(id, display_name, username, avatar_url), post_products(product:products(*)), likes(count), comments(count), bookmarks(count)";
