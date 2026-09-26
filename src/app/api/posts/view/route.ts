import { incrementPostViews } from "@/lib/data/posts";
import { errorResponse, json } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({ postId: z.string().min(1).max(80) });

export async function POST(request: Request) {
  try {
    const { postId } = schema.parse(await request.json());
    await incrementPostViews(postId);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
