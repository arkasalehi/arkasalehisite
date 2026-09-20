import Link from "next/link";
import { listMeetings, listTasks, listChannels } from "@/lib/data/workspace";

export const dynamic = "force-dynamic";

export default async function WorkspaceHomePage() {
  const [meetings, tasks, channels] = await Promise.all([listMeetings(), listTasks(), listChannels()]);
  const upcoming = meetings.filter((m) => new Date(m.startsAt).getTime() >= Date.now() - 60 * 60 * 1000).slice(0, 4);
  const openTasks = tasks.filter((t) => t.status !== "done").slice(0, 6);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_280px]">
      <div className="space-y-4">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-[#8b938d]">فضای کاری آرکا</p>
          <h1 className="mt-1 text-2xl font-semibold">جلسه، چت و کارها در یک جا</h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-[#5b655f]">
            تماس ویدیو با Jitsi، پیام‌ها زنده با Supabase Realtime، و بورد کار تیمی.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/ws/meet" className="rounded-full bg-[#1b6754] px-4 py-2 text-sm text-white">
              ورود به تماس
            </Link>
            <Link href="/ws/chat" className="rounded-full bg-[#f6f7f4] px-4 py-2 text-sm">
              باز کردن چت
            </Link>
          </div>
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">جلسات نزدیک</h2>
          <ul className="mt-3 space-y-2">
            {upcoming.length === 0 ? <li className="text-sm text-[#8b938d]">جلسه‌ای زمان‌بندی نشده.</li> : null}
            {upcoming.map((m) => (
              <li key={m.id}>
                <Link href={`/ws/meet/${m.id}`} className="flex items-center justify-between rounded-xl bg-[#f6f7f4] px-3 py-2.5">
                  <span className="text-sm font-medium">{m.title}</span>
                  <span className="text-[11px] text-[#8b938d]">{new Date(m.startsAt).toLocaleString("fa-IR")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="space-y-4">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">کانال‌ها</h2>
          <ul className="mt-2 space-y-1">
            {channels.map((ch) => (
              <li key={ch.id}>
                <Link href={`/ws/chat/${ch.id}`} className="block rounded-lg px-2 py-1.5 text-sm hover:bg-[#f6f7f4]">
                  # {ch.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">کارهای باز</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {openTasks.length === 0 ? <li className="text-[#8b938d]">خالی است.</li> : null}
            {openTasks.map((t) => (
              <li key={t.id} className="rounded-lg bg-[#f6f7f4] px-2 py-1.5">
                {t.title}
              </li>
            ))}
          </ul>
          <Link href="/ws/tasks" className="mt-3 inline-block text-xs text-[#1b6754]">
            بورد کامل
          </Link>
        </section>
      </div>
    </div>
  );
}
