import { getSession } from "@/lib/auth/session";
import { listUserActivity } from "@/lib/data/interactions";
import { formatDate, postPath } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/layout/Page";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const session = await getSession();
  if (!session) return null;
  const { likes, comments, bookmarks } = await listUserActivity(session.id);

  return (
    <section className="space-y-6">
      <PageHeader title="تاریخچه فعالیت" />
      <ActivityBlock title="پسندها" items={likes} />
      <GlassCard>
        <h2 className="text-xl font-medium">نظرها</h2>
        <div className="mt-3 space-y-3">
          {comments.map((item) => (
            <div key={item.id} className="text-sm">
              <Link href={postPath(item.post.type, item.post.slug)} className="text-accent">
                {item.post.title}
              </Link>
              <p className="text-muted">{item.body}</p>
              <p className="text-xs text-muted">{formatDate(item.createdAt)}</p>
            </div>
          ))}
          {!comments.length ? <p className="text-muted">خالی</p> : null}
        </div>
      </GlassCard>
      <ActivityBlock title="ذخیره‌ها" items={bookmarks} />
    </section>
  );
}

function ActivityBlock({
  title,
  items,
}: {
  title: string;
  items: Array<{
    id: string;
    createdAt: Date;
    post: { title: string; slug: string; type: "BLOG" | "VIDEO" | "SHORT" };
  }>;
}) {
  return (
    <GlassCard>
      <h2 className="text-xl font-medium">{title}</h2>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between gap-4 text-sm">
            <Link href={postPath(item.post.type, item.post.slug)} className="text-accent">
              {item.post.title}
            </Link>
            <span className="text-muted">{formatDate(item.createdAt)}</span>
          </div>
        ))}
        {!items.length ? <p className="text-muted">خالی</p> : null}
      </div>
    </GlassCard>
  );
}
