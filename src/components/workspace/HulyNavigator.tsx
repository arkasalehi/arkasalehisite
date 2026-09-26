"use client";

import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Hash, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboxItem, WorkspaceMeeting, WorkspaceNavNote, WorkspaceNavTask, WorkspaceProject } from "@/lib/data/workspace";
import { ArkaMark } from "@/components/workspace/ArkaMark";
import { wsCopy, type WsLocale } from "@/lib/workspace/copy";

type Person = { id: string; displayName: string };

export function HulyNavigator({
  channels,
  inbox,
  people = [],
  locale = "en",
}: {
  channels: Array<{ id: string; name: string; kind?: string }>;
  inbox: InboxItem[];
  tasks?: WorkspaceNavTask[];
  notes?: WorkspaceNavNote[];
  meetings?: WorkspaceMeeting[];
  projects?: WorkspaceProject[];
  people?: Person[];
  locale?: WsLocale;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = wsCopy(locale);
  const [dmUser, setDmUser] = useState("");
  const [directory, setDirectory] = useState<Person[]>(people);
  const [dirLoaded, setDirLoaded] = useState(people.length > 0);

  function loadDirectory() {
    if (dirLoaded) return;
    setDirLoaded(true);
    void fetch("/api/workspace/directory")
      .then((res) => (res.ok ? res.json() : { people: [] }))
      .then((data: { people?: Person[] }) => setDirectory(data.people ?? []))
      .catch(() => undefined);
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
  }

  const spaces = channels.filter((ch) => ch.kind !== "dm");
  const dms = channels.filter((ch) => ch.kind === "dm");

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-[var(--theme-navpanel-color)] text-[length:var(--ws-type-sm)]">
      <div className="flex h-10 items-center gap-[var(--ws-space-2)] border-b border-[var(--theme-divider-color)] px-[var(--ws-space-3)]">
        <ArkaMark className="h-6 w-6" />
        <div className="min-w-0">
          <p className="truncate font-medium tracking-[var(--ws-tracking-heading)]">Arka</p>
          <p className="truncate text-[length:var(--ws-type-xs)] text-[var(--theme-darker-color)]">{t.chats}</p>
        </div>
      </div>
      <div className="ws-scroll min-h-0 flex-1 overflow-auto px-[var(--ws-space-2)] py-[var(--ws-space-3)]">
        <Section title={t.groups}>
          {spaces.map((ch) => (
            <Nav key={ch.id} href={`/ws/chat/${ch.id}`} on={pathname.includes(ch.id)} label={ch.name} unread={inbox.find((i) => i.channelId === ch.id)?.unread} hash />
          ))}
        </Section>
        <Section title={t.pv}>
          {dms.map((ch) => (
            <Nav key={ch.id} href={`/ws/chat/${ch.id}`} on={pathname.includes(ch.id)} label={ch.name} unread={inbox.find((i) => i.channelId === ch.id)?.unread} />
          ))}
          <form onSubmit={(e) => void createDm(e)} className="mt-[var(--ws-space-1)] flex gap-[var(--ws-space-1)] px-[var(--ws-space-1)]">
            <select value={dmUser} onChange={(e) => setDmUser(e.target.value)} onFocus={loadDirectory} className="ws-input min-w-0 flex-1">
              <option value="">{t.newDm}</option>
              {directory.map((person) => (
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
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-[var(--ws-space-4)]">
      <p className="ws-label px-[var(--ws-space-2)] pb-[var(--ws-space-2)]">{title}</p>
      <div className="flex flex-col gap-[var(--ws-space-1)]">{children}</div>
    </div>
  );
}

function Nav({
  href,
  label,
  on,
  unread,
  hash,
}: {
  href: string;
  label: string;
  on?: boolean;
  unread?: boolean;
  hash?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={cn(
        "flex items-center justify-between rounded-[var(--ws-radius)] px-[var(--ws-space-2)] py-[var(--ws-space-2)] text-[var(--theme-content-color)]",
        on ? "bg-[var(--theme-navpanel-selected)] font-medium text-[var(--theme-caption-color)]" : "hover:bg-[var(--theme-navpanel-hovered)]",
      )}
    >
      <span className="flex min-w-0 items-center gap-[var(--ws-space-2)] truncate">
        {hash ? <Hash className="h-3.5 w-3.5 shrink-0 text-[var(--theme-darker-color)]" strokeWidth={1.75} /> : null}
        <span className="truncate">{label}</span>
      </span>
      {unread ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--ws-accent)]" /> : null}
    </Link>
  );
}
