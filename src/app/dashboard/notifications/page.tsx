import { getSession } from "@/lib/auth/session";
import { listNotifications, markNotificationsRead } from "@/lib/db/notifications";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) return null;
  const notifications = await listNotifications(session.id);
  await markNotificationsRead(session.id);

  return (
    <section>
      <h1 className="text-3xl font-semibold">اعلان‌ها</h1>
      <div className="mt-6 space-y-3">
        {notifications.map((item) => (
          <article key={item.id} className="glass rounded-2xl p-4">
            <p className="font-medium">{item.title}</p>
            {item.body ? <p className="mt-1 text-sm text-slate-400">{item.body}</p> : null}
            <p className="mt-2 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
            {item.link ? (
              <Link href={item.link} className="mt-2 inline-block text-sm text-cyan-300">
                مشاهده
              </Link>
            ) : null}
          </article>
        ))}
        {!notifications.length ? <p className="text-slate-400">اعلانی نیست.</p> : null}
      </div>
    </section>
  );
}
