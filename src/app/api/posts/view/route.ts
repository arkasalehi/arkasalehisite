import { incrementPostViews } from "@/lib/data/posts";
import { errorResponse, json } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({ postId: z.string().min(1).max(80) });

export async function POST(request: Request) {
  try {
    const limited = rateLimit(clientKey(request, "post-view"), 30);
    if (!limited.ok) return json({ error: "درخواست‌های زیاد" }, 429);
    const { postId } = schema.parse(await request.json());
    await incrementPostViews(postId);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
