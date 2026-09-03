import { listAdminComments } from "@/lib/data/comments";
import { CommentModeration } from "@/components/admin/CommentModeration";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  const comments = await listAdminComments();
  return (
    <section>
      <h1 className="text-3xl font-semibold">نظرها</h1>
      <div className="mt-6">
        <CommentModeration comments={comments} />
      </div>
    </section>
  );
}
