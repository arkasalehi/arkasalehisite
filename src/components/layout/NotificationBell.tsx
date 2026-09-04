"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

type PanelBox = { top: number; left: number; width: number };

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [panel, setPanel] = useState<PanelBox | null>(null);
  const [mounted, setMounted] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const el = btn.current;
      if (!el) return;
      setPanel(placePanel(el.getBoundingClientRect()));
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      const t = e.target as Node;
      if (root.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
    if (next && btn.current) setPanel(placePanel(btn.current.getBoundingClientRect()));
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

  const list = (
    <>
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <span className="font-medium">اعلان‌ها</span>
        {unread > 0 ? (
          <button type="button" className="text-xs text-muted hover:text-foreground" onClick={markAll}>
            خوانده شد
          </button>
        ) : null}
      </div>
      <div className="max-h-[min(20rem,calc(100dvh-8rem))] overflow-y-auto">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.link || "/dashboard/notifications"}
            onClick={() => {
              markOne(item);
              setOpen(false);
            }}
            className={`block px-4 py-3 transition hover:bg-foreground/5 ${item.read ? "opacity-70" : "bg-foreground/5"}`}
          >
            <p className="font-medium">{item.title}</p>
            {item.body ? <p className="mt-0.5 text-xs leading-6 text-muted">{item.body}</p> : null}
            <p className="mt-1 text-[11px] text-muted">{formatDate(item.createdAt)}</p>
          </Link>
        ))}
        {!items.length ? <p className="px-4 py-6 text-center text-muted">اعلانی نیست</p> : null}
      </div>
      <Link
        href="/dashboard/notifications"
        onClick={() => setOpen(false)}
        className="block border-t border-[var(--border)] px-4 py-2.5 text-center text-sm text-muted hover:text-foreground"
      >
        همه اعلان‌ها
      </Link>
    </>
  );

  return (
    <div ref={root} className="relative">
      <button
        ref={btn}
        type="button"
        onClick={toggle}
        className="relative rounded-full p-2 text-muted hover:bg-foreground/8 hover:text-foreground"
        aria-label="اعلان‌ها"
        aria-expanded={open}
      >
        <BellIcon />
        {unread > 0 ? (
          <span className="absolute -left-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] font-medium text-background">
            {unread > 9 ? "۹+" : unread}
          </span>
        ) : null}
      </button>
      {open && mounted && panel
        ? createPortal(
            <div
              ref={panelRef}
              className="surface z-50 overflow-hidden p-0 text-sm"
              style={{
                position: "fixed",
                top: panel.top,
                left: panel.left,
                width: panel.width,
              }}
            >
              {list}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function placePanel(rect: DOMRect): PanelBox {
  const margin = 16;
  const vw = window.innerWidth;
  const top = rect.bottom + 8;
  if (vw < 768) {
    return { top, left: margin, width: Math.max(0, vw - margin * 2) };
  }
  const width = Math.min(320, vw - margin * 2);
  let left = rect.right - width;
  if (left < margin) left = margin;
  if (left + width > vw - margin) left = vw - margin - width;
  return { top, left, width };
}
