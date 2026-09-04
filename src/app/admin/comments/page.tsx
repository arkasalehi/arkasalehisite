import { listAdminComments } from "@/lib/data/comments";
import { CommentModeration } from "@/components/admin/CommentModeration";
import { PageHeader } from "@/components/layout/Page";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  const comments = await listAdminComments();
  return (
    <section>
      <PageHeader title="نظرها" />
      <div className="mt-6">
        <CommentModeration comments={comments} />
      </div>
    </section>
  );
}
