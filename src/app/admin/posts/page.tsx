import { listAdminPosts } from "@/lib/data/posts";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/Page";
import { PostsTable } from "@/components/admin/PostsTable";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const posts = await listAdminPosts();

  return (
    <section>
      <PageHeader
        title="محتوا"
        description="وضعیت: پیش‌نویس، زمان‌بندی‌شده، یا منتشر."
        actions={<Button href="/admin/posts/new">محتوای جدید</Button>}
      />
      <div className="mt-6">
        <PostsTable posts={posts} />
      </div>
    </section>
  );
}
