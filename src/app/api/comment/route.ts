import { requireUser } from "@/lib/auth/session";
import { createComment, getCommentById } from "@/lib/data/comments";
import { getPostMeta } from "@/lib/data/posts";
import { notifyAdmins, createNotification } from "@/lib/data/notifications";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { commentSchema } from "@/lib/validators";
import { postPath } from "@/lib/utils";
import { sanitizeText } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    guardMutation(request, "comment", 12);
    const session = await requireUser();
    const input = commentSchema.parse(await request.json());
    const body = sanitizeText(input.body, 2000);
    if (!body) return json({ error: "متن نظر خالی است" }, 400);

    const post = await getPostMeta(input.postId);
    if (!post) return json({ error: "یافت نشد" }, 404);

    const comment = await createComment({
      userId: session.id,
      postId: input.postId,
      body,
      parentId: input.parentId,
    });

    const link = postPath(post.type, post.slug);
    if (input.parentId) {
      const parent = await getCommentById(input.parentId);
      if (parent && parent.userId !== session.id) {
        await createNotification({
          userId: parent.userId,
          type: "REPLY",
          title: `${session.displayName} به نظر شما پاسخ داد`,
          body: body.slice(0, 120),
          link,
          actorId: session.id,
          postId: post.id,
        });
      }
    } else if (post.authorId !== session.id) {
      await notifyAdmins({
        type: "COMMENT",
        title: `${session.displayName} نظر گذاشت`,
        body: post.title,
        link,
        actorId: session.id,
        postId: post.id,
      });
    }

    return json({ comment }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
