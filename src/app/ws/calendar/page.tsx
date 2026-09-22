import { listMeetings } from "@/lib/data/workspace";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const meetings = await listMeetings();
  const byDay = new Map<string, typeof meetings>();
  for (const m of meetings) {
    const key = new Date(m.startsAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const list = byDay.get(key) ?? [];
    list.push(m);
    byDay.set(key, list);
  }

  return (
    <div className="ws-scroll h-full overflow-auto p-6">
      <h1 className="mb-4 text-[18px] font-medium">Calendar</h1>
      <div className="space-y-6">
        {[...byDay.entries()].map(([day, items]) => (
          <section key={day}>
            <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-darker-color)]">{day}</h2>
            <ul className="mt-2 divide-y divide-[var(--theme-divider-color)] border-y border-[var(--theme-divider-color)]">
              {items.map((m) => (
                <li key={m.id}>
                  <Link href={`/ws/meet/${m.id}`} className="flex justify-between py-2 text-[13px] hover:bg-[var(--theme-navpanel-hovered)]">
                    <span>{m.title}</span>
                    <span className="text-[var(--theme-darker-color)]">{new Date(m.startsAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {byDay.size === 0 ? <p className="text-[13px] text-[var(--theme-darker-color)]">Nothing scheduled.</p> : null}
      </div>
    </div>
  );
}
