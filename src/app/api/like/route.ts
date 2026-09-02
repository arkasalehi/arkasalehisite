import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { toggleLike } from "@/lib/db/interactions";
import { notifyAdmins } from "@/lib/db/notifications";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { likeSchema } from "@/lib/validators";
import { postPath } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    guardMutation(request, "like", 40);
    const session = await requireUser();
    const { postId } = likeSchema.parse(await request.json());
    const db = getDb();
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) return json({ error: "یافت نشد" }, 404);

    const result = await toggleLike(session.id, postId);
    if (result.liked && post.authorId !== session.id) {
      await notifyAdmins({
        type: "LIKE",
        title: `${session.displayName} مطلب شما را پسندید`,
        body: post.title,
        link: postPath(post.type, post.slug),
        actorId: session.id,
        postId: post.id,
      });
    }
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
