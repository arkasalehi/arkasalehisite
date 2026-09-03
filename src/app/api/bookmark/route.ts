import { requireUser } from "@/lib/auth/session";
import { getPostMeta } from "@/lib/data/posts";
import { toggleBookmark } from "@/lib/data/interactions";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { bookmarkSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    guardMutation(request, "bookmark", 40);
    const session = await requireUser();
    const { postId } = bookmarkSchema.parse(await request.json());
    const post = await getPostMeta(postId);
    if (!post) return json({ error: "یافت نشد" }, 404);
    return json(await toggleBookmark(session.id, postId));
  } catch (error) {
    return errorResponse(error);
  }
}
