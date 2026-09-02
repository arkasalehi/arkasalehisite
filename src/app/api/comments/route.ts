import { listVisibleComments } from "@/lib/db/comments";
import { errorResponse, json } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const postId = new URL(request.url).searchParams.get("postId");
    if (!postId) return json({ error: "postId لازم است" }, 400);
    const comments = await listVisibleComments(postId);
    return json({ comments });
  } catch (error) {
    return errorResponse(error);
  }
}
