import { getSession } from "@/lib/auth/session";
import { listNotifications, markNotificationsRead } from "@/lib/data/notifications";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { PageHeader } from "@/components/layout/Page";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) return null;
  const notifications = await listNotifications(session.id);
  await markNotificationsRead(session.id);

  return (
    <section>
      <PageHeader title="اعلان‌ها" />
      <div className="mt-6 space-y-3">
        {notifications.map((item) => (
          <article key={item.id} className="surface p-4">
            <p className="font-medium">{item.title}</p>
            {item.body ? <p className="mt-1 text-sm text-muted">{item.body}</p> : null}
            <p className="mt-2 text-xs text-muted">{formatDate(item.createdAt)}</p>
            {item.link ? (
              <Link href={item.link} className="mt-2 inline-block text-sm text-accent">
                مشاهده
              </Link>
            ) : null}
          </article>
        ))}
        {!notifications.length ? <p className="text-muted">اعلانی نیست.</p> : null}
      </div>
    </section>
  );
}
