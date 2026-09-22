"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Hash, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboxItem, WorkspaceMeeting, WorkspaceNote, WorkspaceProject, WorkspaceTask } from "@/lib/data/workspace";
import { ArkaMark } from "@/components/workspace/ArkaMark";
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
    <div className="flex h-full min-h-0 w-full flex-col bg-[var(--theme-navpanel-color)] text-[length:var(--ws-type-sm)]">
      <div className="flex h-10 items-center gap-[var(--ws-space-2)] border-b border-[var(--theme-divider-color)] px-[var(--ws-space-3)]">
        <ArkaMark className="h-6 w-6" />
        <div className="min-w-0">
          <p className="truncate font-medium tracking-[var(--ws-tracking-heading)]">Arka</p>
          <p className="truncate text-[length:var(--ws-type-xs)] text-[var(--theme-darker-color)]">{t.workspace}</p>
        </div>
      </div>
      <div className="ws-scroll min-h-0 flex-1 overflow-auto px-[var(--ws-space-2)] py-[var(--ws-space-3)]">
        <Section title={t.tracker}>
          <Nav href="/ws/tasks" on={pathname.startsWith("/ws/tasks") && view !== "board" && !projectFilter} label={t.issues} count={open} />
          <Nav href="/ws/tasks?view=todo" on={view === "todo"} label={t.backlog} />
          <Nav href="/ws/tasks?view=doing" on={view === "doing"} label={t.active} />
          <Nav href="/ws/tasks?view=board" on={view === "board"} label={t.board} />
          {projects.map((project) => (
            <Nav key={project.id} href={`/ws/tasks?project=${project.id}`} on={projectFilter === project.id} label={`${project.identifier} ${project.name}`} />
          ))}
          <form onSubmit={(e) => void createProject(e)} className="mt-[var(--ws-space-1)] flex gap-[var(--ws-space-1)] px-[var(--ws-space-1)]">
            <input name="name" className="ws-input min-w-0 flex-1" placeholder="New project" />
          </form>
        </Section>
        <Section title={t.chat}>
          {spaces.map((ch) => (
            <Nav key={ch.id} href={`/ws/chat/${ch.id}`} on={pathname.includes(ch.id)} label={ch.name} unread={inbox.find((i) => i.channelId === ch.id)?.unread} hash />
          ))}
          {dms.map((ch) => (
            <Nav key={ch.id} href={`/ws/chat/${ch.id}`} on={pathname.includes(ch.id)} label={ch.name} unread={inbox.find((i) => i.channelId === ch.id)?.unread} />
          ))}
          <form onSubmit={(e) => void createChannel(e)} className="mt-[var(--ws-space-1)] flex gap-[var(--ws-space-1)] px-[var(--ws-space-1)]">
            <input value={channelName} onChange={(e) => setChannelName(e.target.value)} className="ws-input min-w-0 flex-1" placeholder={t.newChannel} />
          </form>
          <form onSubmit={(e) => void createDm(e)} className="mt-[var(--ws-space-1)] flex gap-[var(--ws-space-1)] px-[var(--ws-space-1)]">
            <select value={dmUser} onChange={(e) => setDmUser(e.target.value)} className="ws-input min-w-0 flex-1">
              <option value="">{t.newDm}</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </select>
            <button type="submit" className="ws-btn ws-btn-ghost text-[var(--ws-accent)]">
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
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
    <div className="mb-[var(--ws-space-4)]">
      <p className="px-[var(--ws-space-2)] pb-[var(--ws-space-2)] text-[length:var(--ws-type-xs)] font-semibold uppercase tracking-[var(--ws-tracking-label)] text-[var(--theme-darker-color)]">{title}</p>
      <div className="flex flex-col gap-[var(--ws-space-1)]">{children}</div>
    </div>
  );
}

function Nav({
  href,
  label,
  on,
  count,
  unread,
  hash,
}: {
  href: string;
  label: string;
  on?: boolean;
  count?: number;
  unread?: boolean;
  hash?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between rounded-[var(--ws-radius)] px-[var(--ws-space-2)] py-[var(--ws-space-2)] text-[var(--theme-content-color)]",
        on ? "bg-[var(--theme-navpanel-selected)] font-medium text-[var(--theme-caption-color)]" : "hover:bg-[var(--theme-navpanel-hovered)]",
      )}
    >
      <span className="flex min-w-0 items-center gap-[var(--ws-space-2)] truncate">
        {hash ? <Hash className="h-3.5 w-3.5 shrink-0 text-[var(--theme-darker-color)]" strokeWidth={1.75} /> : null}
        <span className="truncate">{label}</span>
      </span>
      {typeof count === "number" ? <span className="text-[length:var(--ws-type-xs)] text-[var(--theme-darker-color)]">{count}</span> : null}
      {unread ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--ws-accent)]" /> : null}
    </Link>
  );
}
