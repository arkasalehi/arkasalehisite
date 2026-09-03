import Link from "next/link";
import { getAdminStats } from "@/lib/data/users";
import { getContentAnalytics } from "@/lib/data/posts";
import { formatNumber, postPath, typeLabel } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";

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
    <section className="space-y-10">
      <div>
        <p className="text-sm text-accent">پنل مدیریت</p>
        <h1 className="mt-1 text-3xl font-semibold">نمای کلی</h1>
        <p className="mt-2 text-muted">فقط ادمین می‌تواند محتوا بسازد و منتشر کند.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(([label, value]) => (
            <GlassCard key={label}>
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-accent">{formatNumber(value)}</p>
            </GlassCard>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h2 className="text-xl font-semibold">پربازدیدترین مطالب</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {analytics.byViews.map((post) => (
              <li key={post.id} className="flex justify-between gap-3">
                <Link href={postPath(post.type, post.slug)} className="text-accent">
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
          <h2 className="text-xl font-semibold">محبوب‌ترین (پسند)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {analytics.byLikes.map((post) => (
              <li key={post.id} className="flex justify-between gap-3">
                <Link href={postPath(post.type, post.slug)} className="text-accent">
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
