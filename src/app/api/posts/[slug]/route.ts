import { getPublishedPostBySlug } from "@/lib/data/posts";
import { errorResponse, json, publicGetCache } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const limited = rateLimit(clientKey(request, "post"), 60);
    if (!limited.ok) return json({ error: "درخواست‌های زیاد" }, 429);
    const { slug } = await context.params;
    const post = await getPublishedPostBySlug(slug);
    if (!post) return json({ error: "یافت نشد" }, 404);
    return json({ post }, 200, publicGetCache);
  } catch (error) {
    return errorResponse(error);
  }
}
