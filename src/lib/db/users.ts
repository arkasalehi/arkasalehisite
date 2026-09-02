import { getDb } from "./client";
import { hashPassword } from "@/lib/auth/password";

export async function findUserByEmail(email: string) {
  const db = getDb();
  return db.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function createUser(input: {
  email: string;
  username: string;
  displayName: string;
  password: string;
}) {
  const db = getDb();
  return db.user.create({
    data: {
      email: input.email.toLowerCase(),
      username: input.username.toLowerCase(),
      displayName: input.displayName,
      passwordHash: await hashPassword(input.password),
    },
  });
}

export async function updateProfile(
  userId: string,
  data: { displayName?: string; bio?: string | null; avatarUrl?: string | null },
) {
  const db = getDb();
  return db.user.update({
    where: { id: userId },
    data: {
      displayName: data.displayName,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
    },
  });
}

export async function getAdminStats() {
  const db = getDb();
  const [users, posts, comments, likes, products, orders, views] = await Promise.all([
    db.user.count(),
    db.post.count(),
    db.comment.count(),
    db.like.count(),
    db.product.count(),
    db.order.count(),
    db.post.aggregate({ _sum: { viewCount: true } }),
  ]);

  const byType = await db.post.groupBy({
    by: ["type"],
    _count: { _all: true },
  });

  return {
    users,
    posts,
    comments,
    likes,
    products,
    orders,
    views: views._sum.viewCount ?? 0,
    byType,
  };
}
