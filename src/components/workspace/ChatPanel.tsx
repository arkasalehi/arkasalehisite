"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { WorkspaceMessage } from "@/lib/data/workspace";
import { cn } from "@/lib/utils";

const EMOJIS = ["👍", "❤️", "😄", "🎉", "👀"];

async function uploadFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/workspace/files", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "upload");
  return data as { url: string; name: string };
}

export function ChatPanel({
  channelId,
  channelName,
  initial,
  userId,
}: {
  channelId: string;
  channelName: string;
  initial: WorkspaceMessage[];
  userId: string;
}) {
  const [messages, setMessages] = useState(initial);
  const [boundChannel, setBoundChannel] = useState(channelId);
  if (channelId !== boundChannel) {
    setBoundChannel(channelId);
    setMessages(initial);
  }
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<WorkspaceMessage | null>(null);
  const [threadOf, setThreadOf] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                channelId: row.channel_id,
                userId: row.user_id,
                body: row.body,
                createdAt: row.created_at,
                kind: row.kind === "file" || row.kind === "voice" ? row.kind : "text",
                fileName: row.file_name || null,
                fileUrl: row.file_url || null,
                replyTo: row.reply_to || null,
                author: { displayName: row.user_id === userId ? "You" : "Teammate", username: "", avatarUrl: null },
                reactions: [],
              },
            ];
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelId, userId]);

  async function send(payload: { body: string; kind?: WorkspaceMessage["kind"]; fileName?: string; fileUrl?: string }) {
    const text = payload.body.trim();
    if (!text && !payload.fileUrl) return;
    setBody("");
    const replied = replyTo;
    setReplyTo(null);
    await fetch("/api/workspace/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channelId,
        body: text || payload.fileName || "file",
        kind: payload.kind ?? "text",
        fileName: payload.fileName,
        fileUrl: payload.fileUrl,
        replyTo: replied?.id,
      }),
    });
  }

  async function react(messageId: string, emoji: string) {
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
      const up = await uploadFile(file);
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
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
      void uploadFile(file).then((up) => send({ body: "Voice note", kind: "voice", fileName: up.name, fileUrl: up.url }));
    };
    recorder.current = rec;
    rec.start();
    setRecording(true);
  }

  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const roots = messages.filter((m) => !m.replyTo);
  const thread = threadOf ? messages.filter((m) => m.id === threadOf || m.replyTo === threadOf) : [];

  return (
    <div className="relative flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col bg-[var(--theme-bg-color)]">
        <div className="flex h-10 items-center border-b border-[var(--theme-divider-color)] px-4 text-[13px]">
          <span className="font-medium text-[var(--theme-caption-color)]"># {channelName}</span>
        </div>
        <div className="ws-scroll min-h-0 flex-1 overflow-auto px-4 py-4">
          {roots.map((m) => (
            <MessageRow
              key={m.id}
              m={m}
              userId={userId}
              quoted={m.replyTo ? (byId.get(m.replyTo) ?? null) : null}
              replies={messages.filter((x) => x.replyTo === m.id).length}
              onReply={() => setReplyTo(m)}
              onThread={() => setThreadOf(m.id)}
              onReact={(e) => void react(m.id, e)}
              onIssue={() => void toIssue(m)}
            />
          ))}
          {roots.length === 0 ? (
            <p className="py-16 text-center text-[length:var(--ws-type-sm)] text-[var(--theme-darker-color)]">No messages yet. Say what you are cutting, blocking, or waiting on.</p>
          ) : null}
          <div ref={bottom} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send({ body });
          }}
          className="border-t border-[var(--theme-divider-color)] p-3"
        >
          {replyTo ? (
            <div className="mb-2 flex justify-between text-[12px] text-[var(--theme-dark-color)]">
              <span className="truncate">Reply: {(replyTo.body ?? "").slice(0, 80)}</span>
              <button type="button" onClick={() => setReplyTo(null)}>
                ×
              </button>
            </div>
          ) : null}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="h-10 min-w-0 flex-1 rounded-md bg-[var(--input-BackgroundColor)] px-3 text-[13px] outline-none placeholder:text-[var(--input-PlaceholderColor)]"
              placeholder={`Message # ${channelName}`}
              maxLength={4000}
            />
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => void onFile(e)} />
            <button type="button" className="h-10 rounded-md px-2 text-[12px] text-[var(--theme-dark-color)]" onClick={() => fileRef.current?.click()}>
              File
            </button>
            <button type="button" className={cn("h-10 rounded-[var(--ws-radius)] px-2 text-[length:var(--ws-type-xs)]", recording ? "text-[var(--ws-status-cancelled)]" : "text-[var(--theme-dark-color)]")} onClick={() => void toggleVoice()}>
              {recording ? "Stop" : "Voice"}
            </button>
          </div>
        </form>
      </div>
      {threadOf ? (
        <aside className="absolute inset-0 z-30 flex w-full flex-col border-[var(--theme-divider-color)] bg-[var(--theme-navpanel-color)] md:static md:flex md:w-[min(320px,40vw)] md:border-s">
          <div className="flex h-10 items-center justify-between px-3 text-[13px]">
            <span>Thread</span>
            <button type="button" onClick={() => setThreadOf(null)}>
              ×
            </button>
          </div>
          <div className="ws-scroll flex-1 overflow-auto px-3 py-2">
            {thread.map((m) => (
              <MessageRow key={m.id} m={m} userId={userId} quoted={null} replies={0} onReply={() => setReplyTo(m)} onThread={() => undefined} onReact={(e) => void react(m.id, e)} onIssue={() => void toIssue(m)} />
            ))}
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function MessageRow({
  m,
  userId,
  quoted,
  replies,
  onReply,
  onThread,
  onReact,
  onIssue,
}: {
  m: WorkspaceMessage;
  userId: string;
  quoted: WorkspaceMessage | null;
  replies: number;
  onReply: () => void;
  onThread: () => void;
  onReact: (e: string) => void;
  onIssue: () => void;
}) {
  const name = m.userId === userId ? "You" : m.author?.displayName || "Teammate";
  return (
    <article className="group mb-3 flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--ws-radius)] bg-[var(--ws-gray-4)] text-[11px] font-semibold">{name.slice(0, 1).toUpperCase()}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px]">
          <span className="font-medium text-[var(--theme-caption-color)]">{name}</span>
          <span className="ml-2 text-[11px] text-[var(--theme-darker-color)]">{formatTime(m.createdAt)}</span>
        </p>
        {quoted ? <p className="mt-1 border-s-2 border-[var(--ws-accent)] ps-2 text-[length:var(--ws-type-xs)] text-[var(--theme-dark-color)]">{(quoted.body ?? "").slice(0, 140)}</p> : null}
        {m.kind === "voice" && m.fileUrl ? (
          <audio className="mt-1 w-full max-w-sm" controls src={m.fileUrl} />
        ) : m.kind === "file" && m.fileUrl ? (
          <a href={m.fileUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[13px] text-[var(--theme-link-color)]">
            {m.fileName || "Download file"}
          </a>
        ) : (
          <p className="mt-0.5 whitespace-pre-wrap text-[13.5px] leading-6 text-[var(--theme-content-color)]">{m.body}</p>
        )}
        <div className="mt-1 flex flex-wrap gap-1 sm:opacity-0 sm:group-hover:opacity-100">
          {EMOJIS.map((e) => (
            <button key={e} type="button" className="rounded px-1 text-[12px] hover:bg-[var(--theme-navpanel-hovered)]" onClick={() => onReact(e)}>
              {e}
            </button>
          ))}
          <button type="button" className="rounded px-1 text-[11px] text-[var(--theme-darker-color)]" onClick={onReply}>
            Reply
          </button>
          <button type="button" className="rounded px-1 text-[11px] text-[var(--theme-darker-color)]" onClick={onThread}>
            Thread{replies ? ` (${replies})` : ""}
          </button>
          <button type="button" className="rounded px-1 text-[11px] text-[var(--theme-link-color)]" onClick={onIssue}>
            Create issue
          </button>
        </div>
        {m.reactions?.length ? (
          <div className="mt-1 flex gap-1">
            {m.reactions.map((r) => (
              <button key={r.emoji} type="button" className={cn("rounded-full px-2 py-0.5 text-[11px]", r.mine ? "bg-[var(--ws-accent-muted)]" : "bg-[var(--input-BackgroundColor)]")} onClick={() => onReact(r.emoji)}>
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
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
