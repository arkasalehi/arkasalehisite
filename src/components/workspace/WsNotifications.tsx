"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconBell } from "@/components/workspace/ws-icons";
import { cn } from "@/lib/utils";

type Item = { id: string; title: string; body?: string | null; link?: string | null; read: boolean };

export function WsNotifications() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    void fetch("/api/notifications?count=1")
      .then((r) => r.json())
      .then((d) => setUnread(Number(d.unread ?? 0)))
      .catch(() => undefined);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as { notifications: Item[]; unread: number };
      setItems(data.notifications.slice(0, 8));
      setUnread(data.unread);
    }
  }

  async function markAll() {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setUnread(0);
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  }

  return (
    <div className="relative">
      <button type="button" className="relative grid h-7 w-7 place-items-center rounded text-[var(--theme-dark-color)] hover:bg-[var(--theme-navpanel-hovered)]" onClick={() => void toggle()} aria-label="Inbox">
        <IconBell className="h-4 w-4" />
        {unread > 0 ? <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#3364e2]" /> : null}
      </button>
      {open ? (
        <div className="absolute end-0 z-50 mt-2 w-80 overflow-hidden rounded-md border border-[var(--theme-divider-color)] bg-[var(--theme-comp-header-color)]">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-[13px] font-medium">Inbox</p>
            <button type="button" className="text-[11px] text-[var(--theme-link-color)]" onClick={() => void markAll()}>
              Mark all read
            </button>
          </div>
          {items.map((item) => (
            <Link key={item.id} href={item.link || "/ws"} onClick={() => setOpen(false)} className={cn("block px-3 py-2 text-[13px] hover:bg-[var(--theme-navpanel-hovered)]", item.read ? "text-[var(--theme-dark-color)]" : "text-white")}>
              {item.title}
            </Link>
          ))}
          {items.length === 0 ? <p className="px-3 py-8 text-center text-[13px] text-[var(--theme-darker-color)]">No notifications</p> : null}
        </div>
      ) : null}
    </div>
  );
}
