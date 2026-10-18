import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { getAdminStats } from "@/lib/data/users";
import { getContentAnalytics } from "@/lib/data/posts";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatNumber, postPath, typeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [stats, analytics, unread] = await Promise.all([
    getAdminStats().catch(() => null),
    getContentAnalytics().catch(() => ({ byViews: [], byLikes: [] })),
    unreadCount(),
  ]);
  const cards = [
    ["کاربران", stats?.users ?? 0, "/admin/team"],
    ["محتوا", stats?.posts ?? 0, "/admin/posts?type=BLOG"],
    ["نظرها", stats?.comments ?? 0, "/admin/comments"],
    ["پیام‌های نخوانده", unread, "/admin/messages"],
    ["بازدید", stats?.views ?? 0, "/admin/posts?type=BLOG"],
    ["پسندها", stats?.likes ?? 0, "/admin/posts?type=BLOG"],
  ] as const;

  return (
    <section>
      <h1 className="text-[28px] font-semibold tracking-tight">نمای کلی</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">آمار زنده از دیتابیس. فروشگاه و شورتس از رابط سایت برداشته شده‌اند.</p>
      {!stats ? (
        <p className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted">
          آمار در دسترس نیست. اتصال سوپابیس را چک کنید.
        </p>
      ) : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, href]) => (
          <Link key={label} href={href} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-[color-mix(in_srgb,var(--brand)_45%,var(--border))]">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{formatNumber(value)}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium">پربازدیدترین‌ها</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {analytics.byViews.map((post) => (
              <li key={post.id} className="flex items-baseline justify-between gap-3">
                <Link href={postPath(post.type, post.slug)} className="min-w-0 truncate hover:text-[var(--brand)]">
                  {post.title}
                </Link>
                <span className="shrink-0 text-xs text-muted">
                  {formatNumber(post.viewCount)} · {typeLabel(post.type)}
                </span>
              </li>
            ))}
            {!analytics.byViews.length ? <li className="text-muted">هنوز بازدیدی ثبت نشده.</li> : null}
          </ul>
        </article>
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium">محبوب‌ترین‌ها</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {analytics.byLikes.map((post) => (
              <li key={post.id} className="flex items-baseline justify-between gap-3">
                <Link href={postPath(post.type, post.slug)} className="min-w-0 truncate hover:text-[var(--brand)]">
                  {post.title}
                </Link>
                <span className="shrink-0 text-xs text-muted">{formatNumber(post._count.likes)} پسند</span>
              </li>
            ))}
            {!analytics.byLikes.length ? <li className="text-muted">پسندی ثبت نشده.</li> : null}
          </ul>
        </article>
      </div>
    </section>
  );
}

async function unreadCount() {
  try {
    const db = await createServerSupabase();
    const { count, error } = await db.from("contact_messages").select("id", { count: "exact", head: true }).eq("read", false);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
