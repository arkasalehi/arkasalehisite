import { getSession } from "@/lib/auth/session";
import { listSavedPosts } from "@/lib/data/interactions";
import { PostCard } from "@/components/content/PostCard";
import { Stagger } from "@/components/motion/Reveal";
import { formatDate, postPath, typeLabel } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/layout/Page";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const session = await getSession();
  if (!session) return null;
  const saved = await listSavedPosts(session.id);

  return (
    <section>
      <PageHeader title="ذخیره‌ها" description={`${saved.length} مطلب برای خواندن بعدی.`} />
      {!saved.length ? (
        <EmptyState title="هنوز چیزی ذخیره نکرده‌اید" description="مطالب را برای بعد ذخیره کنید." href="/blog" action="رفتن به وبلاگ" />
      ) : (
        <Stagger className="grid gap-6 sm:grid-cols-2">
          {saved.map((row) => (
            <div key={row.id}>
              <PostCard post={row.post} />
              <p className="mt-2 text-xs text-muted">
                {typeLabel(row.post.type)} · ذخیره در {formatDate(row.createdAt)} ·{" "}
                <Link href={postPath(row.post.type, row.post.slug)} className="underline-offset-4 hover:underline">
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
