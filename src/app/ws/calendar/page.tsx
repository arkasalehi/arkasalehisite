import { listMeetings } from "@/lib/data/workspace";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { EmptyState } from "@/components/workspace/EmptyState";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const meetings = await listMeetings().catch(() => []);
  const byDay = new Map<string, typeof meetings>();
  for (const m of meetings) {
    const key = new Date(m.startsAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const list = byDay.get(key) ?? [];
    list.push(m);
    byDay.set(key, list);
  }

  return (
    <div className="ws-scroll h-full overflow-auto p-[var(--ws-space-6)]">
      <h1 className="mb-[var(--ws-space-4)] text-[length:var(--ws-type-xl)]">Calendar</h1>
      {byDay.size === 0 ? (
        <EmptyState icon={<CalendarDays className="h-5 w-5" strokeWidth={1.75} />} title="Nothing scheduled" body="Office rooms appear here by day once they have a start time." />
      ) : (
        <div className="space-y-[var(--ws-space-6)]">
          {[...byDay.entries()].map(([day, items]) => (
            <section key={day}>
              <h2 className="text-[length:var(--ws-type-xs)] font-semibold uppercase tracking-[var(--ws-tracking-label)] text-[var(--theme-darker-color)]">{day}</h2>
              <ul className="mt-[var(--ws-space-2)] divide-y divide-[var(--theme-divider-color)] border-y border-[var(--theme-divider-color)]">
                {items.map((m) => (
                  <li key={m.id}>
                    <Link href={`/ws/meet/${m.id}`} className="ws-row flex justify-between py-[var(--ws-space-2)] text-[length:var(--ws-type-sm)] hover:bg-[var(--theme-navpanel-hovered)]">
                      <span>{m.title}</span>
                      <span className="text-[var(--theme-darker-color)]">{new Date(m.startsAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
