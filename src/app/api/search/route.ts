import { searchPublishedPosts } from "@/lib/data/posts";
import { errorResponse, json, publicGetCache } from "@/lib/http";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const limited = rateLimit(clientKey(request, "search"), 40);
    if (!limited.ok) return json({ error: "درخواست‌های زیاد" }, 429);
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const posts = await searchPublishedPosts(q, 8);
    return json({ posts }, 200, publicGetCache);
  } catch (error) {
    return errorResponse(error);
  }
}
