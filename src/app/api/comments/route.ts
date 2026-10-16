import { listVisibleComments } from "@/lib/data/comments";
import { errorResponse, json } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const limited = rateLimit(clientKey(request, "comments"), 60);
    if (!limited.ok) return json({ error: "درخواست‌های زیاد" }, 429);
    const postId = new URL(request.url).searchParams.get("postId");
    if (!postId) return json({ error: "postId لازم است" }, 400);
    const comments = await listVisibleComments(postId);
    return json({ comments });
  } catch (error) {
    return errorResponse(error);
  }
}
