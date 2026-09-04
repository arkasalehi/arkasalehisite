"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BellIcon } from "@/components/icons";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/components/providers";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Item = {
  id: string;
  title: string;
  body?: string | null;
  link?: string | null;
  read: boolean;
  count?: number;
  createdAt: string;
};

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadCount = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/notifications?count=1", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { unread: number };
        if (!cancelled) setUnread(data.unread);
      } catch {
        /* ignore */
      }
    };

    loadCount();
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          loadCount();
        },
      )
      .subscribe();
    const onVis = () => {
      if (!document.hidden) loadCount();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function loadList() {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { notifications: Item[]; unread: number };
    setItems(data.notifications.slice(0, 8));
    setUnread(data.unread);
    loaded.current = true;
  }

  if (!user) return null;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) await loadList();
  }

  async function markAll() {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setUnread(0);
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  }

  async function markOne(item: Item) {
    if (!item.read) {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [item.id] }),
      });
      setUnread((n) => Math.max(0, n - 1));
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
    }
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="relative rounded-full p-2 text-muted hover:bg-foreground/8 hover:text-foreground"
        aria-label="اعلان‌ها"
      >
        <BellIcon />
        {unread > 0 ? (
          <span className="absolute -left-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] font-medium text-background">
            {unread > 9 ? "۹+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="surface absolute left-0 top-11 z-50 w-80 overflow-hidden p-0 text-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2.5">
            <span className="font-medium">اعلان‌ها</span>
            {unread > 0 ? (
              <button type="button" className="text-xs text-accent" onClick={markAll}>
                خوانده شد
              </button>
            ) : null}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.link || "/dashboard/notifications"}
                onClick={() => markOne(item)}
                className={`block px-3 py-3 transition hover:bg-foreground/5 ${item.read ? "opacity-70" : "bg-foreground/5"}`}
              >
                <p className="font-medium">{item.title}</p>
                {item.body ? <p className="mt-0.5 text-xs leading-6 text-muted">{item.body}</p> : null}
                <p className="mt-1 text-[11px] text-muted">{formatDate(item.createdAt)}</p>
              </Link>
            ))}
            {!items.length ? <p className="px-3 py-6 text-center text-muted">اعلانی نیست</p> : null}
          </div>
          <Link href="/dashboard/notifications" className="block border-t border-[var(--border)] px-3 py-2 text-center text-accent">
            همه اعلان‌ها
          </Link>
        </div>
      ) : null}
    </div>
  );
}
