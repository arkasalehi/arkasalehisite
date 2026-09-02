import { getDb } from "./client";

export async function toggleLike(userId: string, postId: string) {
  const db = getDb();
  const existing = await db.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
  } else {
    await db.like.create({ data: { userId, postId } });
  }

  const count = await db.like.count({ where: { postId } });
  return { liked: !existing, count };
}

export async function toggleBookmark(userId: string, postId: string) {
  const db = getDb();
  const existing = await db.bookmark.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } });
  } else {
    await db.bookmark.create({ data: { userId, postId } });
  }

  const count = await db.bookmark.count({ where: { postId } });
  return { saved: !existing, count };
}

export async function getUserPostState(userId: string | undefined, postId: string) {
  if (!userId) return { liked: false, saved: false };
  const db = getDb();
  const [like, bookmark] = await Promise.all([
    db.like.findUnique({ where: { userId_postId: { userId, postId } } }),
    db.bookmark.findUnique({ where: { userId_postId: { userId, postId } } }),
  ]);
  return { liked: Boolean(like), saved: Boolean(bookmark) };
}

export async function listSavedPosts(userId: string) {
  const db = getDb();
  return db.bookmark.findMany({
    where: { userId },
    include: {
      post: {
        include: {
          category: true,
          author: {
            select: { displayName: true, username: true, avatarUrl: true },
          },
          _count: { select: { likes: true, comments: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listUserActivity(userId: string) {
  const db = getDb();
  const [likes, comments, bookmarks] = await Promise.all([
    db.like.findMany({
      where: { userId },
      include: { post: { select: { title: true, slug: true, type: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.comment.findMany({
      where: { userId },
      include: { post: { select: { title: true, slug: true, type: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.bookmark.findMany({
      where: { userId },
      include: { post: { select: { title: true, slug: true, type: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return { likes, comments, bookmarks };
}
