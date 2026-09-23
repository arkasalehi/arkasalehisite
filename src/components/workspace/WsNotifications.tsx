"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
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
      <button type="button" className="relative grid h-10 w-10 place-items-center rounded-2xl bg-[#1c2128] text-white/80" onClick={() => void toggle()} aria-label="Notifications">
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        {unread > 0 ? (
          <span className="absolute -end-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#e07a3a] px-1 text-[9px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute end-0 z-50 mt-2 w-80 overflow-hidden rounded-[var(--ws-radius)] border border-[var(--theme-divider-color)] bg-[var(--theme-comp-header-color)]">
          <div className="flex items-center justify-between px-[var(--ws-space-3)] py-[var(--ws-space-2)]">
            <p className="text-[length:var(--ws-type-sm)] font-medium">Inbox</p>
            <button type="button" className="text-[length:var(--ws-type-xs)] text-[var(--ws-accent)]" onClick={() => void markAll()}>
              Mark all read
            </button>
          </div>
          {items.map((item) => (
            <Link key={item.id} href={item.link || "/ws"} onClick={() => setOpen(false)} className={cn("block px-[var(--ws-space-3)] py-[var(--ws-space-2)] text-[length:var(--ws-type-sm)] hover:bg-[var(--theme-navpanel-hovered)]", item.read ? "text-[var(--theme-dark-color)]" : "text-[var(--theme-caption-color)]")}>
              {item.title}
            </Link>
          ))}
          {items.length === 0 ? <p className="px-[var(--ws-space-3)] py-[var(--ws-space-6)] text-center text-[length:var(--ws-type-sm)] text-[var(--theme-darker-color)]">No notifications</p> : null}
        </div>
      ) : null}
    </div>
  );
}
