"use client";

import { useEffect, useState } from "react";
import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWsChrome } from "@/lib/theme/workspace";

type Item = { id: string; title: string; body?: string | null; link?: string | null; read: boolean };

export function WsNotifications() {
  const { t } = useWsChrome();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Item[]>([]);

  async function loadCount() {
    const [site, ws] = await Promise.all([
      fetch("/api/notifications?count=1").then((r) => r.json()).catch(() => ({})),
      fetch("/api/workspace/notices").then((r) => r.json()).catch(() => ({})),
    ]);
    setUnread(Number((site as { unread?: number }).unread ?? 0) + Number((ws as { unread?: number }).unread ?? 0));
  }

  useEffect(() => {
    void loadCount();
    const id = window.setInterval(() => void loadCount(), 20_000);
    return () => window.clearInterval(id);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      const [site, ws] = await Promise.all([
        fetch("/api/notifications").then((r) => r.json()).catch(() => ({})),
        fetch("/api/workspace/notices").then((r) => r.json()).catch(() => ({})),
      ]);
      const siteItems = Array.isArray((site as { notifications?: Item[] }).notifications) ? (site as { notifications: Item[] }).notifications : [];
      const wsItems = Array.isArray((ws as { notices?: Item[] }).notices) ? (ws as { notices: Item[] }).notices : [];
      const merged = [...wsItems, ...siteItems].slice(0, 12);
      setItems(merged);
      setUnread(Number((site as { unread?: number }).unread ?? 0) + Number((ws as { unread?: number }).unread ?? 0));
    }
  }

  async function markAll() {
    await Promise.all([
      fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }),
      fetch("/api/workspace/notices", { method: "POST" }),
    ]);
    setUnread(0);
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  }

  return (
    <div className="relative">
      <button type="button" className="ws-icon-btn relative" onClick={() => void toggle()} aria-label={t.notifications}>
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {unread > 0 ? (
          <span className="absolute -end-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-[var(--ws-accent)] px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute end-0 z-50 mt-2 w-80 overflow-hidden rounded-[var(--ws-radius)] border border-[var(--theme-divider-color)] bg-[var(--theme-comp-header-color)]">
          <div className="flex items-center justify-between px-[var(--ws-space-3)] py-[var(--ws-space-2)]">
            <p className="text-[length:var(--ws-type-sm)] font-medium">{t.notifications}</p>
            <button type="button" className="text-[length:var(--ws-type-xs)] text-[var(--ws-accent)]" onClick={() => void markAll()}>
              {t.done}
            </button>
          </div>
          {items.map((item) => (
            <Link key={item.id} href={item.link || "/ws"} onClick={() => setOpen(false)} className={cn("block px-[var(--ws-space-3)] py-[var(--ws-space-2)] text-[length:var(--ws-type-sm)] hover:bg-[var(--theme-navpanel-hovered)]", item.read ? "text-[var(--theme-dark-color)]" : "text-[var(--theme-caption-color)]")}>
              {item.title}
            </Link>
          ))}
          {items.length === 0 ? <p className="px-[var(--ws-space-3)] py-[var(--ws-space-6)] text-center text-[length:var(--ws-type-sm)] text-[var(--theme-darker-color)]">{t.emptyInboxBody}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
