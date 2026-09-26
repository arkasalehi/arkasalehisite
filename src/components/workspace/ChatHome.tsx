"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, SlidersHorizontal, X } from "lucide-react";
import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { ChatPerson, InboxItem } from "@/lib/data/workspace";
import { chatAvatarColor, chatPreviewText, formatChatWhen } from "@/lib/workspace/chat";
import { ChatAvatar } from "@/components/workspace/ChatAvatar";
import { useWsChrome } from "@/lib/theme/workspace";
import { cn } from "@/lib/utils";

type Tab = "all" | "pv" | "groups" | "bots";

function tabOf(kind: string): Tab {
  if (kind === "dm" || kind === "private") return "pv";
  if (kind === "bot") return "bots";
  return "groups";
}

export function ChatHome({
  initial,
  people,
  userId,
}: {
  initial: InboxItem[];
  people: ChatPerson[];
  userId: string;
}) {
  const { locale, t } = useWsChrome();
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [picker, setPicker] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [boundInitial, setBoundInitial] = useState(initial);
  const refreshAt = useRef(0);
  if (initial !== boundInitial) {
    setBoundInitial(initial);
    setItems(initial);
  }

  useEffect(() => {
    let supabase: ReturnType<typeof createBrowserSupabase>;
    try {
      supabase = createBrowserSupabase();
    } catch {
      return;
    }
    async function refresh() {
      const now = Date.now();
      if (now - refreshAt.current < 800) return;
      refreshAt.current = now;
      const res = await fetch("/api/workspace/inbox");
      const data = (await res.json().catch(() => ({}))) as { items?: InboxItem[] };
      if (res.ok && Array.isArray(data.items)) setItems(data.items);
    }
    const channel = supabase
      .channel("workspace-chat-inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "workspace_messages" }, (payload) => {
        const row = payload.new as Record<string, string>;
        const channelId = row.channel_id;
        if (!channelId) return;
        setItems((prev) => {
          const existing = prev.find((item) => item.channelId === channelId);
          if (!existing) {
            void refresh();
            return prev;
          }
          const kind = row.kind === "file" || row.kind === "voice" ? row.kind : "text";
          const fromOther = row.user_id !== userId;
          return [
            {
              ...existing,
              preview: chatPreviewText(kind, row.body ?? "", row.file_name),
              createdAt: row.created_at,
              lastUserId: row.user_id,
              kind,
              unread: existing.unread || fromOther,
              unreadCount: fromOther ? existing.unreadCount + 1 : existing.unreadCount,
              authorName: fromOther ? existing.authorName : "You",
            },
            ...prev.filter((item) => item.channelId !== channelId),
          ];
        });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (tab !== "all" && tabOf(item.channelKind) !== tab) return false;
      if (unreadOnly && !item.unread) return false;
      if (!needle) return true;
      return `${item.channelName} ${item.preview} ${item.authorName}`.toLowerCase().includes(needle);
    });
  }, [items, query, tab, unreadOnly]);

  const unreadChats = items.filter((item) => item.unread).length;
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "all", label: t.all },
    { id: "pv", label: t.pv },
    { id: "groups", label: t.groups },
    { id: "bots", label: t.bots },
  ];

  async function startDm(personId: string) {
    if (busyId) return;
    setBusyId(personId);
    try {
      const res = await fetch("/api/workspace/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "dm", withUserId: personId }),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string };
      if (res.ok && data.id) {
        setPicker(false);
        router.push(`/ws/chat/${data.id}`);
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="ws-chat-home">
      <div className="flex items-center gap-2 px-4 pt-3">
        <label className="ws-chat-search relative min-w-0 flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            className="h-full w-full bg-transparent px-4 text-[14px] text-[var(--theme-caption-color)] outline-none placeholder:text-[var(--theme-darker-color)]"
          />
        </label>
        <div className="relative">
          <button
            type="button"
            className="ws-chat-tool"
            aria-label={t.filters}
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal className="h-5 w-5" strokeWidth={1.75} />
          </button>
          {filtersOpen ? (
            <div className="absolute end-0 top-[calc(100%+8px)] z-20 min-w-[160px] rounded-2xl border border-[var(--theme-divider-color)] bg-[var(--theme-navpanel-color)] p-1 shadow-xl">
              <button
                type="button"
                className={cn("flex w-full rounded-xl px-3 py-2 text-start text-[13px]", unreadOnly ? "bg-[var(--theme-navpanel-selected)]" : "hover:bg-[var(--theme-navpanel-hovered)]")}
                onClick={() => {
                  setUnreadOnly((on) => !on);
                  setFiltersOpen(false);
                }}
              >
                {t.unreadOnly}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pt-3 [scrollbar-width:none]">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={tab === item.id}
            className="ws-chat-pill"
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 pt-5">
        <div className="flex items-center gap-2">
          <h1 className="ws-title text-[var(--theme-caption-color)]">{t.chats}</h1>
          {unreadChats ? <span className="ws-chat-badge">{unreadChats}</span> : null}
        </div>
        <button type="button" className="text-[13px] font-medium text-[#6ea8ff]" onClick={() => { setTab("all"); setUnreadOnly(false); setQuery(""); }}>
          {t.viewAll}
        </button>
      </div>

      <div className="ws-scroll min-h-0 flex-1 overflow-auto px-1 pt-1 pb-24">
        {filtered.length === 0 ? (
          <p className="px-5 py-16 text-center text-[14px] text-[var(--theme-darker-color)]">
            {tab === "bots" ? t.noBots : t.noChats}
            <span className="mt-1 block text-[13px]">{tab === "bots" ? t.noBotsBody : t.noChatsBody}</span>
          </p>
        ) : (
          filtered.map((item) => (
            <Link key={item.channelId} href={`/ws/chat/${item.channelId}`} className="ws-chat-row">
              <ChatAvatar name={item.channelName} url={item.avatarUrl} color={item.avatarColor} />
              <span className="min-w-0 flex-1 border-b border-[var(--theme-divider-color)] py-3">
                <span className="flex items-baseline justify-between gap-3">
                  <span className={cn("truncate text-[15px]", item.unread ? "font-semibold text-[var(--theme-caption-color)]" : "font-medium text-[var(--theme-caption-color)]")}>
                    {item.channelName}
                  </span>
                  <span className="shrink-0 text-[12px] text-[var(--theme-darker-color)]">{formatChatWhen(item.createdAt, locale)}</span>
                </span>
                <span className="mt-0.5 block truncate text-[13px] text-[var(--theme-dark-color)]">
                  {item.kind === "voice" ? t.voiceNote : item.kind === "file" ? t.sharedFile : item.preview}
                </span>
              </span>
            </Link>
          ))
        )}
      </div>

      <button type="button" className="ws-chat-fab" aria-label={t.newChat} onClick={() => setPicker(true)}>
        <Plus className="h-7 w-7" strokeWidth={2.2} />
      </button>

      {picker ? (
        <div className="absolute inset-0 z-30 flex flex-col bg-[var(--theme-bg-color)]">
          <div className="flex items-center gap-2 border-b border-[var(--theme-divider-color)] px-3 py-3">
            <p className="min-w-0 flex-1 text-[16px] font-semibold">{t.newChat}</p>
            <button type="button" className="grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--theme-navpanel-hovered)]" onClick={() => setPicker(false)} aria-label={t.close}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="ws-scroll min-h-0 flex-1 overflow-auto p-2">
            {people.map((person) => (
              <button
                key={person.id}
                type="button"
                disabled={busyId === person.id}
                className="ws-chat-row w-full text-start"
                onClick={() => void startDm(person.id)}
              >
                <ChatAvatar name={person.displayName || person.username} url={person.avatarUrl} color={chatAvatarColor(person.id)} />
                <span className="min-w-0 flex-1 border-b border-[var(--theme-divider-color)] py-3">
                  <span className="block truncate text-[15px] font-medium text-[var(--theme-caption-color)]">{person.displayName || person.username}</span>
                  {person.username ? <span className="text-[12px] text-[var(--theme-darker-color)]">@{person.username}</span> : null}
                </span>
              </button>
            ))}
            {people.length === 0 ? <p className="px-4 py-10 text-center text-[13px] text-[var(--theme-darker-color)]">{t.noChatsBody}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
