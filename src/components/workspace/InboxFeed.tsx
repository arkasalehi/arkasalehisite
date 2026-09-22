"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import type { InboxItem, WorkspaceMeeting, WorkspaceTask } from "@/lib/data/workspace";
import { EmptyState } from "@/components/workspace/EmptyState";
import { wsCopy, type WsLocale } from "@/lib/workspace/copy";
import { cn } from "@/lib/utils";

export function InboxFeed({
  tasks,
  inbox,
  meetings,
}: {
  tasks: WorkspaceTask[];
  inbox: InboxItem[];
  meetings: WorkspaceMeeting[];
}) {
  const [locale, setLocale] = useState<WsLocale>("en");
  useEffect(() => {
    setLocale(localStorage.getItem("ws-locale") === "fa" ? "fa" : "en");
  }, []);
  const t = wsCopy(locale);
  const [filter, setFilter] = useState<"all" | "unread" | "files" | "mentions">("all");
  const open = tasks.filter((item) => !item.parentId && item.status !== "done");
  const messages = useMemo(() => {
    return inbox.filter((item) => {
      if (filter === "unread") return item.unread;
      if (filter === "files") return item.kind === "file" || item.kind === "voice";
      if (filter === "mentions") return item.preview.includes("@") || item.unread;
      return item.preview !== "No messages yet";
    });
  }, [inbox, filter]);
  const empty = filter === "all" ? open.length === 0 && messages.length === 0 && meetings.length === 0 : messages.length === 0;

  return (
    <div className="ws-scroll h-full overflow-auto p-[var(--ws-space-6)]">
      <h1 className="text-[length:var(--ws-type-xl)]">{t.inbox}</h1>
      <p className="mt-[var(--ws-space-1)] text-[length:var(--ws-type-sm)] text-[var(--theme-darker-color)]">{t.activity}</p>
      <div className="mt-[var(--ws-space-4)] flex gap-[var(--ws-space-2)] text-[length:var(--ws-type-xs)]">
        {(["all", "unread", "files", "mentions"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn("ws-btn", filter === key ? "bg-[var(--theme-navpanel-selected)] text-[var(--theme-caption-color)]" : "ws-btn-ghost")}
          >
            {t[key]}
          </button>
        ))}
      </div>
      {empty ? (
        <EmptyState icon={<Inbox className="h-5 w-5" strokeWidth={1.75} />} title={t.emptyInboxTitle} body={t.emptyInboxBody} />
      ) : (
        <div className="mt-[var(--ws-space-6)] divide-y divide-[var(--theme-divider-color)] border-y border-[var(--theme-divider-color)]">
          {filter === "all"
            ? open.slice(0, 8).map((task) => (
                <Link key={task.id} href="/ws/tasks" className="ws-row flex items-center justify-between py-[var(--ws-space-3)] text-[length:var(--ws-type-sm)] hover:bg-[var(--theme-navpanel-hovered)]">
                  <span>{task.title}</span>
                  <span className="text-[length:var(--ws-type-xs)] uppercase tracking-[var(--ws-tracking-label)]" style={{ color: task.status === "doing" ? "var(--ws-status-progress)" : "var(--ws-status-backlog)" }}>
                    {task.status}
                  </span>
                </Link>
              ))
            : null}
          {messages.map((item) => (
            <Link key={item.channelId} href={`/ws/chat/${item.channelId}`} className="ws-row flex items-center justify-between py-[var(--ws-space-3)] text-[length:var(--ws-type-sm)] hover:bg-[var(--theme-navpanel-hovered)]">
              <span className="truncate">
                <span className="text-[var(--theme-darker-color)]">#{item.channelName}</span> {item.preview}
              </span>
              {item.unread ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--ws-accent)]" /> : null}
            </Link>
          ))}
          {filter === "all"
            ? meetings.slice(0, 4).map((meeting) => (
                <Link key={meeting.id} href={`/ws/meet/${meeting.id}`} className="ws-row flex items-center justify-between py-[var(--ws-space-3)] text-[length:var(--ws-type-sm)] hover:bg-[var(--theme-navpanel-hovered)]">
                  <span>{meeting.title}</span>
                  <span className="text-[length:var(--ws-type-xs)] text-[var(--theme-darker-color)]">{new Date(meeting.startsAt).toLocaleString(locale === "fa" ? "fa-IR" : "en-US")}</span>
                </Link>
              ))
            : null}
        </div>
      )}
    </div>
  );
}
