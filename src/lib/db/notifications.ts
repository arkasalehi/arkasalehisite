import type { NotificationType } from "@prisma/client";
import { getDb } from "./client";

export async function listNotifications(userId: string, take = 30) {
  const db = getDb();
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function unreadCount(userId: string) {
  const db = getDb();
  return db.notification.count({ where: { userId, read: false } });
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  const db = getDb();
  await db.notification.updateMany({
    where: { userId, ...(ids?.length ? { id: { in: ids } } : { read: false }) },
    data: { read: true },
  });
}

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  actorId?: string;
  postId?: string;
  groupKey?: string;
}) {
  const db = getDb();
  return db.notification.create({ data: input });
}

async function upsertGrouped(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  actorId?: string;
  postId?: string;
  groupKey?: string;
}) {
  const db = getDb();
  if (input.groupKey && (input.type === "LIKE" || input.type === "COMMENT")) {
    const existing = await db.notification.findFirst({
      where: { userId: input.userId, groupKey: input.groupKey, read: false },
    });
    if (existing) {
      const nextCount = existing.count + 1;
      const title =
        input.type === "LIKE"
          ? `${nextCount} نفر این مطلب را پسندیدند`
          : `${nextCount} نظر تازه روی مطلب`;
      return db.notification.update({
        where: { id: existing.id },
        data: { count: nextCount, title, body: input.body, createdAt: new Date() },
      });
    }
  }
  return db.notification.create({ data: input });
}

export async function notifyAdmins(input: {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  actorId?: string;
  postId?: string;
}) {
  const db = getDb();
  const admins = await db.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (!admins.length) return;
  const groupKey = input.postId ? `${input.type}:${input.postId}` : undefined;
  await Promise.all(
    admins.map((admin) =>
      upsertGrouped({
        userId: admin.id,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
        actorId: input.actorId,
        postId: input.postId,
        groupKey,
      }),
    ),
  );
}

export async function notifyAllUsers(input: {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  postId?: string;
}) {
  const db = getDb();
  const users = await db.user.findMany({ select: { id: true } });
  if (!users.length) return;
  await db.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
      postId: input.postId,
    })),
  });
}
