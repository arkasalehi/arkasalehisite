import { getSession } from "@/lib/auth/session";
import { listUserActivity } from "@/lib/db/interactions";
import { formatDate, postPath } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const session = await getSession();
  if (!session) return null;
  const { likes, comments, bookmarks } = await listUserActivity(session.id);

  return (
    <section className="space-y-8">
      <h1 className="text-3xl font-semibold">تاریخچه فعالیت</h1>
      <ActivityBlock title="پسندها" items={likes} />
      <div>
        <h2 className="text-xl font-medium">نظرها</h2>
        <div className="mt-3 space-y-2">
          {comments.map((item) => (
            <div key={item.id} className="text-sm">
              <Link href={postPath(item.post.type, item.post.slug)} className="text-cyan-300">
                {item.post.title}
              </Link>
              <p className="text-slate-400">{item.body}</p>
              <p className="text-slate-500">{formatDate(item.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>
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
    <div>
      <h2 className="text-xl font-medium">{title}</h2>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between gap-4 text-sm">
            <Link href={postPath(item.post.type, item.post.slug)} className="text-cyan-300">
              {item.post.title}
            </Link>
            <span className="text-slate-500">{formatDate(item.createdAt)}</span>
          </div>
        ))}
        {!items.length ? <p className="text-slate-500">خالی</p> : null}
      </div>
    </div>
  );
}
