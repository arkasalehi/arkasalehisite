import { cache } from "react";
import type { PostStatus, PostType, Prisma } from "@prisma/client";
import { getDb } from "./client";
import { readingTimeFromBody } from "@/lib/utils";
import { cached, invalidateCache } from "@/lib/cache";

const publicInclude = {
  category: true,
  author: {
    select: { id: true, displayName: true, username: true, avatarUrl: true },
  },
  products: { include: { product: true } },
  _count: { select: { likes: true, comments: true, bookmarks: true } },
} satisfies Prisma.PostInclude;

export type PublicPost = Prisma.PostGetPayload<{ include: typeof publicInclude }>;

const live = (extra: Prisma.PostWhereInput = {}): Prisma.PostWhereInput => {
  const now = new Date();
  return {
    status: "PUBLISHED",
    AND: [
      { OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }] },
      { OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
    ],
    ...extra,
  };
};

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
    try {
      const db = getDb();
      return await db.post.findMany({
        where: live({
          ...(opts?.type ? { type: opts.type } : {}),
          ...(opts?.featured ? { featured: true } : {}),
          ...(opts?.categorySlug ? { category: { slug: opts.categorySlug } } : {}),
        }),
        include: publicInclude,
        orderBy:
          opts?.sort === "popular"
            ? [{ viewCount: "desc" }, { publishedAt: "desc" }]
            : [{ featured: "desc" }, { publishedAt: "desc" }],
        take: opts?.take ?? 24,
        skip: opts?.skip ?? 0,
      });
    } catch (error) {
      console.error("listPublishedPosts", error);
      return [];
    }
  });
});

export const searchPublishedPosts = cache(async (q: string, take = 8) => {
  const query = q.trim().slice(0, 80);
  if (query.length < 2) return [];
  return cached(`search:${query}:${take}`, 10_000, async () => {
    try {
      const db = getDb();
      return await db.post.findMany({
        where: live({
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { excerpt: { contains: query, mode: "insensitive" } },
            { body: { contains: query, mode: "insensitive" } },
          ],
        }),
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          excerpt: true,
          coverImage: true,
        },
        orderBy: { publishedAt: "desc" },
        take,
      });
    } catch (error) {
      console.error("searchPublishedPosts", error);
      return [];
    }
  });
});

export const getPublishedPostBySlug = cache(async (slug: string, type?: PostType) => {
  try {
    const db = getDb();
    return await db.post.findFirst({
      where: live({
        slug,
        ...(type ? { type } : {}),
      }),
      include: publicInclude,
    });
  } catch (error) {
    console.error("getPublishedPostBySlug", error);
    return null;
  }
});

export const getPostBySlugAny = cache(async (slug: string) => {
  try {
    const db = getDb();
    return await db.post.findUnique({
      where: { slug },
      include: publicInclude,
    });
  } catch (error) {
    console.error("getPostBySlugAny", error);
    return null;
  }
});

export async function getPostsBySlugs(slugs: string[]) {
  if (!slugs.length) return [];
  try {
    const db = getDb();
    const posts = await db.post.findMany({
      where: live({ slug: { in: slugs } }),
      include: publicInclude,
    });
    const map = new Map(posts.map((p) => [p.slug, p]));
    return slugs.map((s) => map.get(s)).filter((p): p is PublicPost => Boolean(p));
  } catch (error) {
    console.error("getPostsBySlugs", error);
    return [];
  }
}

export async function listPublishedSlugs(type?: PostType) {
  try {
    const db = getDb();
    return await db.post.findMany({
      where: live(type ? { type } : {}),
      select: { slug: true, type: true, updatedAt: true },
    });
  } catch (error) {
    console.error("listPublishedSlugs", error);
    return [];
  }
}

export async function incrementPostViews(id: string) {
  try {
    const db = getDb();
    await db.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  } catch (error) {
    console.error("incrementPostViews", error);
  }
}

export async function listCategories() {
  try {
    const db = getDb();
    return await db.category.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("listCategories", error);
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const db = getDb();
    return await db.category.findUnique({ where: { slug } });
  } catch (error) {
    console.error("getCategoryBySlug", error);
    return null;
  }
}

export async function listAdminPosts() {
  const db = getDb();
  return db.post.findMany({
    include: {
      category: true,
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getPostById(id: string) {
  const db = getDb();
  return db.post.findUnique({
    where: { id },
    include: publicInclude,
  });
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
  const db = getDb();
  const emptyToNull = (v?: string | null) => (v ? v : null);
  const payload = {
    type: data.type,
    status: data.status,
    title: data.title,
    slug: data.slug,
    excerpt: emptyToNull(data.excerpt),
    body: emptyToNull(data.body),
    coverImage: emptyToNull(data.coverImage),
    videoUrl: emptyToNull(data.videoUrl),
    thumbnailUrl: emptyToNull(data.thumbnailUrl),
    duration: data.duration ?? null,
    categoryId: emptyToNull(data.categoryId),
    seoTitle: emptyToNull(data.seoTitle),
    seoDescription: emptyToNull(data.seoDescription),
    readingTime: readingTimeFromBody(data.body),
    featured: data.featured ?? false,
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
    publishedAt:
      data.status === "PUBLISHED"
        ? data.scheduledAt
          ? new Date(data.scheduledAt)
          : new Date()
        : null,
    authorId,
  };

  if (data.id) {
    const existing = await db.post.findUnique({ where: { id: data.id } });
    const scheduled = data.scheduledAt ? new Date(data.scheduledAt) : null;
    await db.post.update({
      where: { id: data.id },
      data: {
        ...payload,
        publishedAt:
          data.status === "PUBLISHED" ? (scheduled ?? existing?.publishedAt ?? new Date()) : null,
        products: {
          deleteMany: {},
          create: (data.productIds ?? []).map((productId) => ({ productId })),
        },
      },
    });
    invalidateCache("posts:");
    invalidateCache("search:");
    return data.id;
  }

  const created = await db.post.create({
    data: {
      ...payload,
      products: {
        create: (data.productIds ?? []).map((productId) => ({ productId })),
      },
    },
  });
  invalidateCache("posts:");
  invalidateCache("search:");
  return created.id;
}

export async function deletePost(id: string) {
  const db = getDb();
  await db.post.delete({ where: { id } });
  invalidateCache("posts:");
  invalidateCache("search:");
}

export async function bulkPosts(ids: string[], action: "delete" | "publish" | "draft") {
  const db = getDb();
  if (action === "delete") {
    await db.post.deleteMany({ where: { id: { in: ids } } });
  } else {
    await db.post.updateMany({
      where: { id: { in: ids } },
      data:
        action === "publish"
          ? { status: "PUBLISHED", publishedAt: new Date(), scheduledAt: null }
          : { status: "DRAFT" },
    });
  }
  invalidateCache("posts:");
  invalidateCache("search:");
}

export async function getRelatedPosts(post: { id: string; type: PostType; categoryId: string | null }) {
  try {
    const db = getDb();
    return await db.post.findMany({
      where: live({
        id: { not: post.id },
        OR: [{ categoryId: post.categoryId ?? undefined }, { type: post.type }],
      }),
      include: publicInclude,
      orderBy: { publishedAt: "desc" },
      take: 3,
    });
  } catch (error) {
    console.error("getRelatedPosts", error);
    return [];
  }
}

export async function getContentAnalytics() {
  const db = getDb();
  const [byViews, byLikes, totals] = await Promise.all([
    db.post.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, slug: true, type: true, viewCount: true, _count: { select: { likes: true, comments: true } } },
      orderBy: { viewCount: "desc" },
      take: 8,
    }),
    db.post.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, slug: true, type: true, viewCount: true, _count: { select: { likes: true, comments: true } } },
      orderBy: { likes: { _count: "desc" } },
      take: 8,
    }),
    db.post.aggregate({
      where: { status: "PUBLISHED" },
      _sum: { viewCount: true },
      _avg: { viewCount: true },
      _count: true,
    }),
  ]);
  return { byViews, byLikes, totals };
}
