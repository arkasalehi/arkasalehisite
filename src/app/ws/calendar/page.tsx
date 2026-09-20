import { listMeetings } from "@/lib/data/workspace";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const meetings = await listMeetings();
  const byDay = new Map<string, typeof meetings>();
  for (const m of meetings) {
    const key = new Date(m.startsAt).toLocaleDateString("fa-IR");
    const list = byDay.get(key) ?? [];
    list.push(m);
    byDay.set(key, list);
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">تقویم جلسات</h1>
      <div className="space-y-4">
        {[...byDay.entries()].map(([day, items]) => (
          <section key={day} className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">{day}</h2>
            <ul className="mt-2 space-y-2">
              {items.map((m) => (
                <li key={m.id}>
                  <Link href={`/ws/meet/${m.id}`} className="flex justify-between rounded-xl bg-[#f6f7f4] px-3 py-2 text-sm">
                    <span>{m.title}</span>
                    <span className="text-[#8b938d]">{new Date(m.startsAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {byDay.size === 0 ? <p className="text-sm text-[#8b938d]">جلسه‌ای در تقویم نیست.</p> : null}
      </div>
    </div>
  );
}
