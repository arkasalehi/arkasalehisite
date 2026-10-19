import { listAdminPosts } from "@/lib/data/posts";
import { Button } from "@/components/ui/Button";
import { PostsTable } from "@/components/admin/PostsTable";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const type = sp.type === "VIDEO" ? "VIDEO" : sp.type === "BLOG" ? "BLOG" : undefined;
  const loaded = await listAdminPosts().catch(() => null);
  const posts = (loaded ?? []).filter((post) => (type ? post.type === type : post.type !== "SHORT"));
  const title = type === "VIDEO" ? "ویدیوها" : type === "BLOG" ? "نوشته‌ها" : "محتوا";

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted">جستجو، فیلتر وضعیت، پیش‌نویس و انتشار.</p>
        </div>
        <Button href={type === "VIDEO" ? "/admin/posts/new?type=VIDEO" : "/admin/posts/new"}>مورد جدید</Button>
      </div>
      <div className="mt-6">
        {loaded ? (
          <PostsTable posts={posts} />
        ) : (
          <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted">فهرست محتوا بارگذاری نشد.</p>
        )}
      </div>
    </section>
  );
}
