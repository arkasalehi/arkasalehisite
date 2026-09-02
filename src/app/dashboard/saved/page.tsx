import { getSession } from "@/lib/auth/session";
import { listSavedPosts } from "@/lib/db/interactions";
import { PostCard } from "@/components/content/PostCard";
import { Stagger } from "@/components/motion/Reveal";
import { formatDate, postPath, typeLabel } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const session = await getSession();
  if (!session) return null;
  const saved = await listSavedPosts(session.id);

  return (
    <section>
      <h1 className="text-3xl font-semibold">ذخیره‌ها</h1>
      <p className="mt-2 text-sm text-muted">{saved.length} مطلب برای خواندن بعدی.</p>
      {!saved.length ? (
        <div className="glass mt-8 rounded-[var(--radius-md)] p-8 text-center">
          <p className="text-muted">هنوز چیزی ذخیره نکرده‌اید.</p>
          <Link href="/blog" className="mt-3 inline-block text-accent">
            رفتن به وبلاگ
          </Link>
        </div>
      ) : (
        <Stagger className="mt-6 grid gap-5 sm:grid-cols-2">
          {saved.map((row) => (
            <div key={row.id}>
              <PostCard post={row.post} />
              <p className="mt-2 text-xs text-muted">
                {typeLabel(row.post.type)} · ذخیره در {formatDate(row.createdAt)} ·{" "}
                <Link href={postPath(row.post.type, row.post.slug)} className="text-accent">
                  باز کردن
                </Link>
              </p>
            </div>
          ))}
        </Stagger>
      )}
    </section>
  );
}
