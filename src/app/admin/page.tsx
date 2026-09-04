import Link from "next/link";
import { getAdminStats } from "@/lib/data/users";
import { getContentAnalytics } from "@/lib/data/posts";
import { formatNumber, postPath, typeLabel } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/layout/Page";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [stats, analytics] = await Promise.all([getAdminStats(), getContentAnalytics()]);
  const cards = [
    ["کاربران", stats.users],
    ["محتوا", stats.posts],
    ["نظرها", stats.comments],
    ["پسندها", stats.likes],
    ["بازدید", stats.views],
    ["سفارش‌ها", stats.orders],
  ] as const;

  return (
    <section>
      <PageHeader
        eyebrow="پنل مدیریت"
        title="نمای کلی"
        description="فقط ادمین می‌تواند محتوا بسازد و منتشر کند."
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <GlassCard key={label}>
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-3xl font-medium text-foreground">{formatNumber(value)}</p>
          </GlassCard>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h2 className="text-lg font-medium">پربازدیدترین مطالب</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {analytics.byViews.map((post) => (
              <li key={post.id} className="flex justify-between gap-3">
                <Link href={postPath(post.type, post.slug)} className="hover:text-accent">
                  {post.title}
                </Link>
                <span className="text-muted">
                  {formatNumber(post.viewCount)} بازدید · {typeLabel(post.type)}
                </span>
              </li>
            ))}
            {!analytics.byViews.length ? <p className="text-muted">داده‌ای نیست</p> : null}
          </ul>
        </GlassCard>
        <GlassCard>
          <h2 className="text-lg font-medium">محبوب‌ترین (پسند)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {analytics.byLikes.map((post) => (
              <li key={post.id} className="flex justify-between gap-3">
                <Link href={postPath(post.type, post.slug)} className="hover:text-accent">
                  {post.title}
                </Link>
                <span className="text-muted">{formatNumber(post._count.likes)} پسند</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </section>
  );
}
