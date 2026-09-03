import { requireAdmin } from "@/lib/auth/session";
import { listAdminPosts, upsertPost, deletePost, getPostById, bulkPosts } from "@/lib/data/posts";
import { notifyAllUsers } from "@/lib/data/notifications";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { bulkPostsSchema, postInputSchema } from "@/lib/validators";
import { postPath } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    return json({ posts: await listAdminPosts() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    guardMutation(request, "admin-posts", 40);
    const session = await requireAdmin();
    const input = postInputSchema.parse(await request.json());
    const id = await upsertPost(session.id, { ...input, status: input.status ?? "DRAFT" });
    if (input.status === "PUBLISHED" && (!input.scheduledAt || new Date(input.scheduledAt) <= new Date())) {
      await notifyAllUsers({
        type: "NEW_CONTENT",
        title: "محتوای تازه منتشر شد",
        body: input.title,
        link: postPath(input.type, input.slug),
        postId: id,
      });
    }
    return json({ id }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    guardMutation(request, "admin-posts", 40);
    const session = await requireAdmin();
    const body = await request.json();
    if (body.action && Array.isArray(body.ids)) {
      const input = bulkPostsSchema.parse(body);
      await bulkPosts(input.ids, input.action);
      return json({ ok: true });
    }
    const id = String(body.id ?? "");
    if (!id) return json({ error: "id لازم است" }, 400);
    const input = postInputSchema.parse(body);
    await upsertPost(session.id, { ...input, id, status: input.status ?? "DRAFT" });
    return json({ id });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    guardMutation(request, "admin-posts", 40);
    await requireAdmin();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return json({ error: "id لازم است" }, 400);
    const existing = await getPostById(id);
    if (!existing) return json({ error: "یافت نشد" }, 404);
    await deletePost(id);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
