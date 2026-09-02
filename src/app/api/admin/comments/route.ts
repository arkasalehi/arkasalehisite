import { requireAdmin } from "@/lib/auth/session";
import { updateCommentStatus, deleteComment } from "@/lib/db/comments";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(["VISIBLE", "HIDDEN", "SPAM"]).optional(),
  delete: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  try {
    guardMutation(request, "admin-comments", 40);
    await requireAdmin();
    const input = patchSchema.parse(await request.json());
    if (input.delete) {
      await deleteComment(input.id);
      return json({ ok: true });
    }
    if (!input.status) return json({ error: "status لازم است" }, 400);
    await updateCommentStatus(input.id, input.status);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
