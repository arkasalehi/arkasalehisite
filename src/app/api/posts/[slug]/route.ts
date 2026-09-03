import { getPublishedPostBySlug } from "@/lib/data/posts";
import { errorResponse, json, publicGetCache } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const post = await getPublishedPostBySlug(slug);
    if (!post) return json({ error: "یافت نشد" }, 404);
    return json({ post }, 200, publicGetCache);
  } catch (error) {
    return errorResponse(error);
  }
}
