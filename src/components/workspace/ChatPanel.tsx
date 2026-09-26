"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Paperclip, Mic, SendHorizontal } from "lucide-react";
import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { ChatPerson, WorkspaceMessage } from "@/lib/data/workspace";
import { chatAvatarColor, CHAT_PAGE_SIZE } from "@/lib/workspace/chat";
import { loadChatPrefs } from "@/lib/workspace/prefs";
import { uploadWorkspaceFile } from "@/lib/workspace/uploadClient";
import { ChatAvatar } from "@/components/workspace/ChatAvatar";
import { useWsChrome } from "@/lib/theme/workspace";
import { cn } from "@/lib/utils";

const EMOJIS = ["👍", "❤️", "😄", "🎉", "👀"];

function asMessage(row: Record<string, string>, fallbackName: string): WorkspaceMessage {
  return {
    id: row.id,
    channelId: row.channel_id,
    userId: row.user_id,
    body: row.body,
    createdAt: row.created_at,
    kind: row.kind === "file" || row.kind === "voice" ? row.kind : "text",
    fileName: row.file_name || null,
    fileUrl: row.file_url || null,
    replyTo: row.reply_to || null,
    author: { displayName: fallbackName, username: "", avatarUrl: null },
    reactions: [],
  };
}

export function ChatPanel({
  channelId,
  channelName,
  channelKind = "channel",
  initial,
  userId,
  people = [],
  selfName = "",
  selfAvatar = null,
}: {
  channelId: string;
  channelName: string;
  channelKind?: string;
  initial: WorkspaceMessage[];
  userId: string;
  people?: ChatPerson[];
  selfName?: string;
  selfAvatar?: string | null;
}) {
  const { t } = useWsChrome();
  const [messages, setMessages] = useState(initial);
  const [boundChannel, setBoundChannel] = useState(channelId);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<WorkspaceMessage | null>(null);
  const [threadOf, setThreadOf] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [hasMore, setHasMore] = useState(initial.length >= CHAT_PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  if (channelId !== boundChannel) {
    setBoundChannel(channelId);
    setMessages(initial);
    setHasMore(initial.length >= CHAT_PAGE_SIZE);
  }
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const sending = useRef(false);
  const peopleById = useMemo(() => new Map(people.map((person) => [person.id, person])), [people]);
  const names = useCallback(
    (uid: string, fallback?: string) => {
      if (uid === userId) return selfName || t.you;
      return peopleById.get(uid)?.displayName || fallback || t.guest;
    },
    [peopleById, selfName, t.guest, t.you, userId],
  );
  const avatars = useCallback(
    (uid: string, fallback?: string | null) => {
      if (uid === userId) return selfAvatar;
      return peopleById.get(uid)?.avatarUrl ?? fallback ?? null;
    },
    [peopleById, selfAvatar, userId],
  );

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "auto" });
  }, [boundChannel]);

  const lastMessage = messages.at(-1);
  useEffect(() => {
    if (lastMessage?.userId === userId) {
      bottom.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [lastMessage?.id, lastMessage?.userId, userId]);

  const lastId = messages.at(-1)?.id;
  useEffect(() => {
    if (lastId?.startsWith("tmp-")) return;
    void fetch("/api/workspace/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId }),
    });
  }, [channelId, lastId]);

  const mergeIncoming = useCallback((incoming: WorkspaceMessage) => {
    setMessages((prev) => {
      if (prev.some((item) => item.id === incoming.id)) return prev;
      const withoutTemp = prev.filter(
        (item) => !(item.id.startsWith("tmp-") && item.userId === incoming.userId && item.body === incoming.body),
      );
      return [...withoutTemp, incoming];
    });
  }, []);

  useEffect(() => {
    let supabase: ReturnType<typeof createBrowserSupabase>;
    try {
      supabase = createBrowserSupabase();
    } catch {
      return;
    }
    const channel = supabase
      .channel(`workspace-chat:${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "workspace_messages", filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const row = payload.new as Record<string, string>;
          if (!row?.id) return;
          mergeIncoming({
            ...asMessage(row, names(row.user_id)),
            author: {
              displayName: names(row.user_id),
              username: peopleById.get(row.user_id)?.username ?? "",
              avatarUrl: avatars(row.user_id),
            },
          });
        },
      )
      .on("broadcast", { event: "message" }, ({ payload }) => {
        const row = payload as WorkspaceMessage | null;
        if (!row?.id) return;
        mergeIncoming(row);
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [avatars, channelId, mergeIncoming, names, peopleById]);

  async function send(payload: { body: string; kind?: WorkspaceMessage["kind"]; fileName?: string; fileUrl?: string }) {
    const text = payload.body.trim();
    if ((!text && !payload.fileUrl) || sending.current) return;
    sending.current = true;
    setBody("");
    const replied = replyTo;
    setReplyTo(null);
    const tempId = `tmp-${crypto.randomUUID()}`;
    const optimistic: WorkspaceMessage = {
      id: tempId,
      channelId,
      userId,
      body: text || payload.fileName || "file",
      createdAt: new Date().toISOString(),
      kind: payload.kind ?? "text",
      fileName: payload.fileName ?? null,
      fileUrl: payload.fileUrl ?? null,
      replyTo: replied?.id ?? null,
      author: { displayName: selfName || t.you, username: "", avatarUrl: selfAvatar },
      reactions: [],
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await fetch("/api/workspace/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          body: optimistic.body,
          kind: optimistic.kind,
          fileName: payload.fileName,
          fileUrl: payload.fileUrl,
          replyTo: replied?.id,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: WorkspaceMessage; id?: string };
      if (!res.ok) {
        setMessages((prev) => prev.filter((item) => item.id !== tempId));
        return;
      }
      const confirmed = data.message ? { ...data.message, reactions: data.message.reactions ?? [] } : { ...optimistic, id: data.id || tempId };
      setMessages((prev) => {
        const without = prev.filter((item) => item.id !== tempId && item.id !== confirmed.id);
        return [...without, confirmed];
      });
    } finally {
      sending.current = false;
    }
  }

  async function react(messageId: string, emoji: string) {
    if (messageId.startsWith("tmp-")) return;
    setMessages((prev) =>
      prev.map((item) => {
        if (item.id !== messageId) return item;
        const current = item.reactions.find((reaction) => reaction.emoji === emoji);
        const reactions = current?.mine
          ? item.reactions
              .map((reaction) => (reaction.emoji === emoji ? { ...reaction, count: reaction.count - 1, mine: false } : reaction))
              .filter((reaction) => reaction.count > 0)
          : current
            ? item.reactions.map((reaction) => (reaction.emoji === emoji ? { ...reaction, count: reaction.count + 1, mine: true } : reaction))
            : [...item.reactions, { emoji, count: 1, mine: true }];
        return { ...item, reactions };
      }),
    );
    await fetch("/api/workspace/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, emoji }),
    });
  }

  async function toIssue(m: WorkspaceMessage) {
    await fetch("/api/workspace/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: (m.body ?? "Chat note").slice(0, 160) }),
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const up = await uploadWorkspaceFile(file);
      await send({ body: up.name, kind: "file", fileName: up.name, fileUrl: up.url });
    } catch {
      return;
    }
  }

  async function toggleVoice() {
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    chunks.current = [];
    rec.ondataavailable = (ev) => {
      if (ev.data.size) chunks.current.push(ev.data);
    };
    rec.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
      void uploadWorkspaceFile(file).then((up) => send({ body: t.voiceNote, kind: "voice", fileName: up.name, fileUrl: up.url }));
    };
    recorder.current = rec;
    rec.start();
    setRecording(true);
  }

  async function loadEarlier() {
    if (!hasMore || loadingMore) return;
    const oldest = messages[0]?.createdAt;
    if (!oldest) return;
    const el = scroller.current;
    const prevHeight = el?.scrollHeight ?? 0;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/workspace/messages?channelId=${encodeURIComponent(channelId)}&before=${encodeURIComponent(oldest)}`);
      const data = (await res.json().catch(() => ({}))) as { messages?: WorkspaceMessage[]; hasMore?: boolean };
      const older = Array.isArray(data.messages) ? data.messages : [];
      setHasMore(Boolean(data.hasMore) && older.length >= CHAT_PAGE_SIZE);
      if (older.length) {
        setMessages((prev) => {
          const seen = new Set(prev.map((item) => item.id));
          return [...older.filter((item) => !seen.has(item.id)), ...prev];
        });
        requestAnimationFrame(() => {
          if (el) el.scrollTop = el.scrollHeight - prevHeight;
        });
      }
    } finally {
      setLoadingMore(false);
    }
  }

  const [chatPrefs, setChatPrefs] = useState(() => loadChatPrefs());
  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const roots = messages.filter((m) => !m.replyTo);
  const thread = threadOf ? messages.filter((m) => m.id === threadOf || m.replyTo === threadOf) : [];
  const dm = channelKind === "dm" || channelKind === "private";

  return (
    <div className="relative flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col bg-[var(--theme-bg-color)]">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--theme-divider-color)] px-2">
          <Link href="/ws/chat" className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--theme-navpanel-hovered)] md:hidden" aria-label={t.back}>
            <ChevronLeft className="h-5 w-5 rtl:rotate-180" strokeWidth={1.75} />
          </Link>
          <ChatAvatar name={channelName} color={chatAvatarColor(channelId)} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-[var(--theme-caption-color)]">{channelName}</p>
            <p className="truncate text-[11px] text-[var(--theme-darker-color)]">{dm ? t.pv : t.groups}</p>
          </div>
        </div>
        <div ref={scroller} className="ws-scroll min-h-0 flex-1 overflow-auto px-3 py-3">
          {hasMore ? (
            <button type="button" className="mx-auto mb-3 block text-[12px] text-[var(--theme-link-color)]" onClick={() => void loadEarlier()} disabled={loadingMore}>
              {t.loadEarlier}
            </button>
          ) : null}
          {roots.map((m) => (
            <MessageRow
              key={m.id}
              m={m}
              mine={m.userId === userId}
              name={names(m.userId, m.author?.displayName)}
              avatarUrl={avatars(m.userId, m.author?.avatarUrl)}
              quoted={m.replyTo ? (byId.get(m.replyTo) ?? null) : null}
              replies={messages.filter((x) => x.replyTo === m.id).length}
              onReply={() => setReplyTo(m)}
              onThread={() => setThreadOf(m.id)}
              onReact={(e) => void react(m.id, e)}
              onIssue={() => void toIssue(m)}
              labels={{ reply: t.reply, thread: t.thread, issue: t.createIssue }}
            />
          ))}
          {roots.length === 0 ? (
            <p className="py-16 text-center text-[length:var(--ws-type-sm)] text-[var(--theme-darker-color)]">{t.emptyChannelBody}</p>
          ) : null}
          <div ref={bottom} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send({ body });
          }}
          className="ws-composer border-t border-[var(--theme-divider-color)] p-3"
        >
          {replyTo ? (
            <div className="mb-2 flex items-center justify-between rounded-xl bg-[var(--input-BackgroundColor)] px-3 py-2 text-[12px] text-[var(--theme-dark-color)]">
              <span className="truncate">{t.reply}: {(replyTo.body ?? "").slice(0, 80)}</span>
              <button type="button" onClick={() => setReplyTo(null)} aria-label={t.close}>
                ×
              </button>
            </div>
          ) : null}
          <div className="flex min-w-0 items-end gap-2">
            <button type="button" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--theme-dark-color)] hover:bg-[var(--theme-navpanel-hovered)]" onClick={() => fileRef.current?.click()} aria-label={t.file}>
              <Paperclip className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => void onFile(e)} />
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.shiftKey) return;
                if (loadChatPrefs().enterToSend) {
                  e.preventDefault();
                  void send({ body });
                }
              }}
              onFocus={() => setChatPrefs(loadChatPrefs())}
              className={cn("ws-chat-compose min-w-0 flex-1 px-4 text-[14px] outline-none placeholder:text-[var(--input-PlaceholderColor)]", chatPrefs.compact ? "h-10" : "h-11")}
              placeholder={t.messagePlaceholder}
              maxLength={4000}
            />
            {body.trim() ? (
              <button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--ws-accent)] text-white" aria-label={t.send}>
                <SendHorizontal className="h-5 w-5 rtl:rotate-180" strokeWidth={2} />
              </button>
            ) : (
              <button type="button" className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full", recording ? "bg-[var(--ws-status-cancelled)] text-white" : "text-[var(--theme-dark-color)] hover:bg-[var(--theme-navpanel-hovered)]")} onClick={() => void toggleVoice()} aria-label={recording ? t.stop : t.voice}>
                <Mic className="h-5 w-5" strokeWidth={1.75} />
              </button>
            )}
          </div>
        </form>
      </div>
      {threadOf ? (
        <aside className="absolute inset-0 z-30 flex w-full flex-col border-[var(--theme-divider-color)] bg-[var(--theme-navpanel-color)] md:static md:flex md:w-[min(320px,40vw)] md:border-s">
          <div className="flex h-10 items-center justify-between px-3 text-[13px]">
            <span>{t.thread}</span>
            <button type="button" onClick={() => setThreadOf(null)} aria-label={t.close}>
              ×
            </button>
          </div>
          <div className="ws-scroll flex-1 overflow-auto px-3 py-2">
            {thread.map((m) => (
              <MessageRow
                key={m.id}
                m={m}
                mine={m.userId === userId}
                name={names(m.userId, m.author?.displayName)}
                avatarUrl={avatars(m.userId, m.author?.avatarUrl)}
                quoted={null}
                replies={0}
                onReply={() => setReplyTo(m)}
                onThread={() => undefined}
                onReact={(e) => void react(m.id, e)}
                onIssue={() => void toIssue(m)}
                labels={{ reply: t.reply, thread: t.thread, issue: t.createIssue }}
              />
            ))}
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function MessageRow({
  m,
  mine,
  name,
  avatarUrl,
  quoted,
  replies,
  onReply,
  onThread,
  onReact,
  onIssue,
  labels,
}: {
  m: WorkspaceMessage;
  mine: boolean;
  name: string;
  avatarUrl: string | null;
  quoted: WorkspaceMessage | null;
  replies: number;
  onReply: () => void;
  onThread: () => void;
  onReact: (e: string) => void;
  onIssue: () => void;
  labels: { reply: string; thread: string; issue: string };
}) {
  return (
    <article className={cn("group mb-2 flex max-w-[86%] gap-2", mine ? "ms-auto" : "")}>
      {!mine ? <ChatAvatar name={name} url={avatarUrl} color={chatAvatarColor(m.userId)} size={32} /> : <span className="w-8 shrink-0" />}
      <div className={cn("min-w-0 rounded-[14px] px-3 py-2", mine ? "rounded-se-md bg-[var(--ws-accent)] text-white" : "bg-[var(--input-BackgroundColor)] text-[var(--theme-content-color)]")}>
        {!mine ? <p className="mb-0.5 text-[12px] font-medium text-[var(--theme-caption-color)]">{name}</p> : null}
        {quoted ? <p className={cn("mb-1 border-s-2 ps-2 text-[12px]", mine ? "border-white/60 text-white/85" : "border-[var(--ws-accent)] text-[var(--theme-dark-color)]")}>{(quoted.body ?? "").slice(0, 140)}</p> : null}
        {m.kind === "voice" && m.fileUrl ? (
          <audio className="mt-1 w-full max-w-sm" controls src={m.fileUrl} />
        ) : m.kind === "file" && m.fileUrl ? (
          <a href={m.fileUrl} target="_blank" rel="noreferrer" className={cn("mt-1 inline-block text-[13px] underline", mine ? "text-white" : "text-[var(--theme-link-color)]")}>
            {m.fileName || m.body}
          </a>
        ) : (
          <p className="whitespace-pre-wrap text-[14px] leading-6">{m.body}</p>
        )}
        <p className={cn("mt-1 text-end text-[10px]", mine ? "text-white/75" : "text-[var(--theme-darker-color)]")}>{formatTime(m.createdAt)}</p>
        <div className={cn("mt-1 flex flex-wrap gap-1", mine ? "text-white/90" : "", "sm:opacity-0 sm:group-hover:opacity-100")}>
          {EMOJIS.map((e) => (
            <button key={e} type="button" className="rounded px-1 text-[12px] hover:bg-black/10" onClick={() => onReact(e)}>
              {e}
            </button>
          ))}
          <button type="button" className="rounded px-1 text-[11px]" onClick={onReply}>
            {labels.reply}
          </button>
          <button type="button" className="rounded px-1 text-[11px]" onClick={onThread}>
            {labels.thread}
            {replies ? ` (${replies})` : ""}
          </button>
          <button type="button" className="rounded px-1 text-[11px]" onClick={onIssue}>
            {labels.issue}
          </button>
        </div>
        {m.reactions?.length ? (
          <div className="mt-1 flex gap-1">
            {m.reactions.map((r) => (
              <button key={r.emoji} type="button" className={cn("rounded-full px-2 py-0.5 text-[11px]", r.mine ? "bg-black/15" : "bg-black/10")} onClick={() => onReact(r.emoji)}>
                {r.emoji} {r.count}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
