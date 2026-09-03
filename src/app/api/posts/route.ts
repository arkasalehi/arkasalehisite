import { listPublishedPosts } from "@/lib/data/posts";
import { errorResponse, json, publicGetCache } from "@/lib/http";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import type { PostType } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const limited = rateLimit(clientKey(request, "posts"), 60);
    if (!limited.ok) return json({ error: "درخواست‌های زیاد" }, 429);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as PostType | null;
    const category = searchParams.get("category") || undefined;
    const sort = searchParams.get("sort") === "popular" ? "popular" : "latest";
    const take = Number(searchParams.get("take") ?? 24);
    const posts = await listPublishedPosts({
      type: type || undefined,
      categorySlug: category,
      sort,
      take: Number.isFinite(take) ? Math.min(take, 48) : 24,
    });
    return json({ posts }, 200, publicGetCache);
  } catch (error) {
    return errorResponse(error);
  }
}
