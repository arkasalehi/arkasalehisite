import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { listMeetings, listTasks, listChannels, listInbox, listNotes } from "@/lib/data/workspace";

export const dynamic = "force-dynamic";

export default async function WorkspaceHomePage() {
  const session = await getSession();
  const [meetings, tasks, channels, inbox, notes] = await Promise.all([
    listMeetings(),
    listTasks(),
    listChannels(),
    listInbox(session?.id).catch(() => []),
    listNotes().catch(() => []),
  ]);
  const first = (session?.displayName || "there").split(" ")[0];
  const upcoming = meetings.filter((m) => new Date(m.startsAt).getTime() >= Date.now() - 60 * 60 * 1000);
  const openTasks = tasks.filter((t) => !t.parentId && t.status !== "done");
  const chatHref = channels[0] ? `/ws/chat/${channels[0].id}` : "/ws/chat";
  const latest = inbox[0];

  return (
    <div className="mx-auto max-w-xl space-y-5 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#1b6754] to-[#3d8fe0] text-sm font-semibold text-white">
            {first.slice(0, 1)}
          </span>
          <div>
            <p className="text-[13px] text-[#8b938d]">Welcome back</p>
            <p className="text-[16px] font-semibold">{session?.displayName || "Collaborator"}</p>
          </div>
        </div>
        <Link href="/ws/chat" className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm" aria-label="Search">
          ⌕
        </Link>
      </div>
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight">Hello {first}</h1>
        <p className="text-[13px] text-[#8b938d]">Stay focused, finish tasks easily</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/ws/meet" className="rounded-[28px] bg-[#ead9ff] p-4">
          <p className="text-[13px] font-medium">Voice Calls</p>
          <p className="mt-3 text-[40px] font-semibold leading-none">{upcoming.length}</p>
          <p className="mt-1 text-[12px] text-[#6d5bb8]">upcoming</p>
        </Link>
        <Link href="/ws/chat" className="rounded-[28px] bg-[#fff1c9] p-4">
          <p className="text-[13px] font-medium">Team Channels</p>
          <p className="mt-3 text-[40px] font-semibold leading-none">{channels.length}</p>
          <p className="mt-1 text-[12px] text-[#9a7b20]">live</p>
        </Link>
        <Link href="/ws/tasks" className="col-span-2 rounded-[28px] bg-[#d9f5e8] p-4">
          <p className="text-[13px] font-medium">Task Threads</p>
          <p className="mt-2 text-[36px] font-semibold leading-none">{openTasks.length} open</p>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <section className="rounded-[28px] bg-white p-4 shadow-sm">
          <p className="text-[13px] font-semibold">Tasks</p>
          <ul className="mt-3 space-y-2 text-[13px]">
            {openTasks.slice(0, 3).map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-[#3d4741]">
                <span className="grid h-4 w-4 place-items-center rounded-full border border-[#cfd6d0] text-[9px]">{t.status === "doing" ? "•" : ""}</span>
                {t.title}
              </li>
            ))}
            {openTasks.length === 0 ? <li className="text-[#8b938d]">All clear</li> : null}
          </ul>
        </section>
        <section className="rounded-[28px] bg-white p-4 shadow-sm">
          <p className="text-[13px] font-semibold">Notes</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {notes.slice(0, 4).map((n) => (
              <span key={n.id} className="rounded-full bg-[#efe8ff] px-3 py-1 text-[12px]">
                {n.title}
              </span>
            ))}
            {notes.length === 0 ? <span className="text-[12px] text-[#8b938d]">Tap + to add</span> : null}
          </div>
        </section>
      </div>
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold">Latest messages</h2>
          <Link href="/ws/chat" className="text-[12px] text-[#7c5cfc]">
            See All
          </Link>
        </div>
        {latest ? (
          <Link href={`/ws/chat/${latest.channelId}`} className="mt-3 flex items-center gap-3 rounded-[24px] bg-white p-3 shadow-sm">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#ead9ff] text-sm font-semibold">{latest.authorName.slice(0, 1) || "C"}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium">{latest.authorName || latest.channelName}</span>
              <span className="block truncate text-[12px] text-[#8b938d]">{latest.preview}</span>
            </span>
          </Link>
        ) : (
          <Link href={chatHref} className="mt-3 block rounded-[24px] bg-white p-4 text-sm text-[#8b938d]">
            Open team chat
          </Link>
        )}
      </section>
    </div>
  );
}
