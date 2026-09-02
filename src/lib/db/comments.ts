import { getDb } from "./client";

export async function listVisibleComments(postId: string) {
  try {
    const db = getDb();
    return await db.comment.findMany({
      where: { postId, status: "VISIBLE", parentId: null },
      include: {
        user: {
          select: { id: true, displayName: true, username: true, avatarUrl: true },
        },
        replies: {
          where: { status: "VISIBLE" },
          include: {
            user: {
              select: { id: true, displayName: true, username: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
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
  const db = getDb();
  return db.comment.create({
    data: {
      userId: input.userId,
      postId: input.postId,
      body: input.body.trim(),
      parentId: input.parentId || null,
    },
    include: {
      user: {
        select: { id: true, displayName: true, username: true, avatarUrl: true },
      },
    },
  });
}

export async function listAdminComments() {
  const db = getDb();
  return db.comment.findMany({
    include: {
      user: { select: { displayName: true, email: true } },
      post: { select: { title: true, slug: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function updateCommentStatus(id: string, status: "VISIBLE" | "HIDDEN" | "SPAM") {
  const db = getDb();
  return db.comment.update({ where: { id }, data: { status } });
}

export async function deleteComment(id: string) {
  const db = getDb();
  await db.comment.delete({ where: { id } });
}
