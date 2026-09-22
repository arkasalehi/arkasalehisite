"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { InboxItem, WorkspaceMeeting, WorkspaceNote, WorkspaceProject, WorkspaceTask } from "@/lib/data/workspace";
import { wsCopy, type WsLocale } from "@/lib/workspace/copy";

type Person = { id: string; displayName: string };

export function HulyNavigator({
  channels,
  inbox,
  tasks,
  notes,
  meetings,
  projects = [],
  people = [],
  locale = "en",
}: {
  channels: Array<{ id: string; name: string; kind?: string }>;
  inbox: InboxItem[];
  tasks: WorkspaceTask[];
  notes: WorkspaceNote[];
  meetings: WorkspaceMeeting[];
  projects?: WorkspaceProject[];
  people?: Person[];
  locale?: WsLocale;
}) {
  const pathname = usePathname();
  const view = useSearchParams().get("view");
  const projectFilter = useSearchParams().get("project");
  const router = useRouter();
  const t = wsCopy(locale);
  const open = tasks.filter((item) => !item.parentId && item.status !== "done").length;
  const [channelName, setChannelName] = useState("");
  const [dmUser, setDmUser] = useState("");

  async function createChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!channelName.trim()) return;
    const res = await fetch("/api/workspace/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: channelName.trim(), kind: "channel" }),
    });
    const data = await res.json();
    setChannelName("");
    if (res.ok && data.id) router.push(`/ws/chat/${data.id}`);
    router.refresh();
  }

  async function createDm(e: React.FormEvent) {
    e.preventDefault();
    if (!dmUser) return;
    const res = await fetch("/api/workspace/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "dm", withUserId: dmUser }),
    });
    const data = await res.json();
    if (res.ok && data.id) router.push(`/ws/chat/${data.id}`);
    router.refresh();
  }

  async function createProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    e.currentTarget.reset();
    await fetch("/api/workspace/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    router.refresh();
  }

  const spaces = channels.filter((ch) => ch.kind !== "dm");
  const dms = channels.filter((ch) => ch.kind === "dm");

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--theme-navpanel-color)] text-[13px]">
      <div className="flex h-10 items-center gap-2 border-b border-[var(--theme-divider-color)] px-3">
        <span className="grid h-6 w-6 place-items-center rounded bg-[#3364e2] text-[11px] font-bold text-white">A</span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-[var(--theme-caption-color)]">Arka</p>
          <p className="truncate text-[10px] text-[var(--theme-darker-color)]">{t.workspace}</p>
        </div>
      </div>
      <div className="ws-scroll min-h-0 flex-1 overflow-auto px-2 py-3">
        <Section title={t.tracker}>
          <Nav href="/ws/tasks" on={pathname.startsWith("/ws/tasks") && view !== "board" && !projectFilter} label={t.issues} count={open} />
          <Nav href="/ws/tasks?view=todo" on={view === "todo"} label={t.backlog} />
          <Nav href="/ws/tasks?view=doing" on={view === "doing"} label={t.active} />
          <Nav href="/ws/tasks?view=board" on={view === "board"} label={t.board} />
          {projects.map((project) => (
            <Nav key={project.id} href={`/ws/tasks?project=${project.id}`} on={projectFilter === project.id} label={`${project.identifier} ${project.name}`} />
          ))}
          <form onSubmit={(e) => void createProject(e)} className="mt-1 flex gap-1 px-1">
            <input name="name" className="h-7 min-w-0 flex-1 rounded bg-[var(--input-BackgroundColor)] px-2 text-[12px] outline-none" placeholder="New project" />
          </form>
        </Section>
        <Section title={t.chat}>
          {spaces.map((ch) => (
            <Nav key={ch.id} href={`/ws/chat/${ch.id}`} on={pathname.includes(ch.id)} label={`# ${ch.name}`} unread={inbox.find((i) => i.channelId === ch.id)?.unread} />
          ))}
          {dms.map((ch) => (
            <Nav key={ch.id} href={`/ws/chat/${ch.id}`} on={pathname.includes(ch.id)} label={ch.name} unread={inbox.find((i) => i.channelId === ch.id)?.unread} />
          ))}
          <form onSubmit={(e) => void createChannel(e)} className="mt-1 flex gap-1 px-1">
            <input value={channelName} onChange={(e) => setChannelName(e.target.value)} className="h-7 min-w-0 flex-1 rounded bg-[var(--input-BackgroundColor)] px-2 text-[12px] outline-none" placeholder={t.newChannel} />
          </form>
          <form onSubmit={(e) => void createDm(e)} className="mt-1 flex gap-1 px-1">
            <select value={dmUser} onChange={(e) => setDmUser(e.target.value)} className="h-7 min-w-0 flex-1 rounded bg-[var(--input-BackgroundColor)] px-1 text-[12px]">
              <option value="">{t.newDm}</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </select>
            <button type="submit" className="text-[11px] text-[var(--theme-link-color)]">
              Go
            </button>
          </form>
        </Section>
        <Section title={t.documents}>
          {notes.map((note) => (
            <Nav key={note.id} href={`/ws/docs/${note.id}`} on={pathname.includes(note.id)} label={note.title} />
          ))}
          <Nav href="/ws/docs" on={pathname === "/ws/docs"} label="New document" />
        </Section>
        <Section title={t.office}>
          {meetings.map((meeting) => (
            <Nav key={meeting.id} href={`/ws/meet/${meeting.id}`} on={pathname.includes(meeting.id)} label={meeting.title} />
          ))}
          <Nav href="/ws/meet" on={pathname === "/ws/meet"} label="Rooms" />
          <Nav href="/ws/calendar" on={pathname.startsWith("/ws/calendar")} label={t.calendar} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-darker-color)]">{title}</p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function Nav({
  href,
  label,
  on,
  count,
  unread,
}: {
  href: string;
  label: string;
  on?: boolean;
  count?: number;
  unread?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between rounded px-2 py-[5px] text-[var(--theme-content-color)]",
        on ? "bg-[var(--theme-navpanel-selected)] text-[var(--theme-caption-color)]" : "hover:bg-[var(--theme-navpanel-hovered)]",
      )}
    >
      <span className="truncate">{label}</span>
      {typeof count === "number" ? <span className="text-[10px] text-[var(--theme-darker-color)]">{count}</span> : null}
      {unread ? <span className="h-1.5 w-1.5 rounded-full bg-[#3364e2]" /> : null}
    </Link>
  );
}
