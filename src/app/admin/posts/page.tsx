import Link from "next/link";
import { listAdminPosts } from "@/lib/data/posts";
import { Button } from "@/components/ui/Button";
import { PostsTable } from "@/components/admin/PostsTable";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const posts = await listAdminPosts();

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">محتوا</h1>
        <Button href="/admin/posts/new">محتوای جدید</Button>
      </div>
      <p className="mt-2 text-sm text-muted">
        وضعیت: پیش‌نویس، زمان‌بندی‌شده (انتشار + تاریخ آینده)، یا منتشر.{" "}
        <Link href="/admin/settings" className="text-accent">
          تنظیمات سایت
        </Link>
      </p>
      <div className="mt-6">
        <PostsTable posts={posts} />
      </div>
    </section>
  );
}
