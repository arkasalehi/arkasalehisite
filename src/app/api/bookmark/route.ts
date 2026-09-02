import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { toggleBookmark } from "@/lib/db/interactions";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { bookmarkSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    guardMutation(request, "bookmark", 40);
    const session = await requireUser();
    const { postId } = bookmarkSchema.parse(await request.json());
    const post = await getDb().post.findUnique({ where: { id: postId } });
    if (!post) return json({ error: "یافت نشد" }, 404);
    return json(await toggleBookmark(session.id, postId));
  } catch (error) {
    return errorResponse(error);
  }
}
