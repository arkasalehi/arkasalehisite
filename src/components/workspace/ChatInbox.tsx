"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { InboxItem } from "@/lib/data/workspace";

const FILTERS = ["All", "Mentions", "Threads", "Reactions"] as const;

export function ChatInbox({
  items,
  username,
}: {
  items: InboxItem[];
  username: string;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (q && !`${item.channelName} ${item.preview} ${item.authorName}`.toLowerCase().includes(q)) return false;
      if (filter === "Mentions") return item.preview.toLowerCase().includes(`@${username.toLowerCase()}`) || item.preview.includes("@");
      if (filter === "Threads") return item.preview.startsWith("Re:") || item.kind !== "text";
      if (filter === "Reactions") return false;
      return true;
    });
  }, [filter, items, query, username]);

  const groups = useMemo(() => {
    const map = new Map<string, InboxItem[]>();
    for (const item of visible) {
      const label = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "Channels";
      const list = map.get(label) ?? [];
      list.push(item);
      map.set(label, list);
    }
    return [...map.entries()];
  }, [visible]);

  return (
    <div className="mx-auto w-full max-w-xl px-1 pb-8">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-[12px] font-medium whitespace-nowrap ${
              filter === f ? "bg-[#1e2a24] text-white" : "bg-white text-[#5b655f] ring-1 ring-[#e8ece6]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <label className="mt-4 flex h-11 items-center rounded-full bg-white px-4 text-sm ring-1 ring-[#e8ece6]">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search messages"
          className="w-full bg-transparent outline-none"
        />
      </label>
      <div className="mt-5 flex items-end justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight">Latest messages</h1>
        <span className="text-[12px] text-[#8b938d]">{visible.length}</span>
      </div>
      <div className="mt-3 space-y-5">
        {groups.map(([day, list]) => (
          <section key={day}>
            <p className="mb-2 flex items-center justify-between text-[12px] text-[#8b938d]">
              Channel in <span>{day}</span>
            </p>
            <ul className="space-y-2">
              {list.map((item) => (
                <li key={item.channelId}>
                  <Link href={`/ws/chat/${item.channelId}`} className="flex items-center gap-3 rounded-[22px] bg-white px-3 py-3 shadow-sm ring-1 ring-[#eef1ea]">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7c5cfc] to-[#3d8fe0] text-sm font-semibold text-white">
                      {(item.authorName || item.channelName).slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[14px] font-semibold">{item.authorName || item.channelName}</span>
                        <span className="text-[11px] text-[#9aa39c]">
                          {item.createdAt ? new Date(item.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : ""}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[12.5px] text-[#6d7871]">
                        {item.kind === "file" ? `Shared ${item.preview}` : item.preview}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {visible.length === 0 ? <p className="pt-10 text-center text-sm text-[#8b938d]">No conversations in this filter.</p> : null}
      </div>
    </div>
  );
}
