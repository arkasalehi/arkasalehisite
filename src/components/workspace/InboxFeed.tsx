"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { InboxItem, WorkspaceMeeting, WorkspaceTask } from "@/lib/data/workspace";
import { wsCopy, type WsLocale } from "@/lib/workspace/copy";

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
      return true;
    });
  }, [inbox, filter]);

  return (
    <div className="ws-scroll h-full overflow-auto p-6">
      <h1 className="text-[18px] font-medium">{t.inbox}</h1>
      <p className="mt-1 text-[13px] text-[var(--theme-darker-color)]">{t.activity}</p>
      <div className="mt-4 flex gap-2 text-[12px]">
        {(["all", "unread", "files", "mentions"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded px-2 py-1 ${filter === key ? "bg-[var(--theme-navpanel-selected)]" : "hover:bg-[var(--theme-navpanel-hovered)]"}`}
          >
            {t[key]}
          </button>
        ))}
      </div>
      <div className="mt-6 divide-y divide-[var(--theme-divider-color)] border-y border-[var(--theme-divider-color)]">
        {filter === "all"
          ? open.slice(0, 8).map((task) => (
              <Link key={task.id} href="/ws/tasks" className="flex items-center justify-between py-3 text-[13px] hover:bg-[var(--theme-navpanel-hovered)]">
                <span>{task.title}</span>
                <span className="text-[11px] uppercase text-[var(--theme-darker-color)]">{task.status}</span>
              </Link>
            ))
          : null}
        {messages.map((item) => (
          <Link key={item.channelId} href={`/ws/chat/${item.channelId}`} className="flex items-center justify-between py-3 text-[13px] hover:bg-[var(--theme-navpanel-hovered)]">
            <span className="truncate">
              <span className="text-[var(--theme-darker-color)]">#{item.channelName}</span> {item.preview}
            </span>
            {item.unread ? <span className="h-1.5 w-1.5 rounded-full bg-[#3364e2]" /> : null}
          </Link>
        ))}
        {filter === "all"
          ? meetings.slice(0, 4).map((meeting) => (
              <Link key={meeting.id} href={`/ws/meet/${meeting.id}`} className="flex items-center justify-between py-3 text-[13px] hover:bg-[var(--theme-navpanel-hovered)]">
                <span>{meeting.title}</span>
                <span className="text-[11px] text-[var(--theme-darker-color)]">{new Date(meeting.startsAt).toLocaleString(locale === "fa" ? "fa-IR" : "en-US")}</span>
              </Link>
            ))
          : null}
      </div>
    </div>
  );
}
