"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { WorkspaceMessage } from "@/lib/data/workspace";
import { cn } from "@/lib/utils";
import { IconBell, IconFolder, IconImage, IconMore, IconSend, IconVideo } from "@/components/workspace/ws-icons";

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
  const [body, setBody] = useState("");
  const [online, setOnline] = useState(1);
  const [infoOpen, setInfoOpen] = useState(false);
  const [notify, setNotify] = useState(true);
  const [replyTo, setReplyTo] = useState<WorkspaceMessage | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initial);
  }, [initial, channelId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const apply = () => setInfoOpen(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [channelId]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
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
                replyTo: row.reply_to || null,
                author: { displayName: row.user_id === userId ? "You" : "Teammate", username: "", avatarUrl: null },
                reactions: [],
              },
            ];
          });
        },
      )
      .on("presence", { event: "sync" }, () => {
        setOnline(Object.keys(channel.presenceState()).length || 1);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ userId, at: Date.now() });
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelId, userId]);

  async function send(payload: { body: string; kind?: WorkspaceMessage["kind"]; fileName?: string }) {
    const text = payload.body.trim();
    if (!text) return;
    setBody("");
    const replied = replyTo;
    setReplyTo(null);
    setComposerOpen(false);
    await fetch("/api/workspace/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channelId,
        body: text,
        kind: payload.kind ?? "text",
        fileName: payload.fileName,
        replyTo: replied?.id,
      }),
    });
  }

  async function react(messageId: string, emoji: string) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const current = m.reactions.find((r) => r.emoji === emoji);
        if (current?.mine) {
          return {
            ...m,
            reactions: m.reactions
              .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, mine: false } : r))
              .filter((r) => r.count > 0),
          };
        }
        if (current) {
          return { ...m, reactions: m.reactions.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r)) };
        }
        return { ...m, reactions: [...m.reactions, { emoji, count: 1, mine: true }] };
      }),
    );
    await fetch("/api/workspace/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, emoji }),
    });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void send({ body: `Shared ${file.name}`, kind: "file", fileName: file.name });
  }

  async function sendVoice() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      rec.start();
      await new Promise((r) => setTimeout(r, 1200));
      rec.stop();
      stream.getTracks().forEach((t) => t.stop());
      await send({ body: "Voice note 0:12", kind: "voice" });
    } catch {
      await send({ body: "Voice note 0:12", kind: "voice" });
    }
  }

  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const days = useMemo(() => groupByDay(messages), [messages]);

  return (
    <div className="relative flex h-full min-h-0 flex-1 bg-[#f6f3ff]">
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-white/70 bg-white/80 px-4 py-3 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7c5cfc] to-[#3d8fe0] text-sm font-semibold text-white">
              {channelName.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">{channelName}</p>
              <p className="text-[12px] text-[#1b6754]">{online} online</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/ws/meet" className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#6d7871] shadow-sm" aria-label="Start call">
              <IconVideo className="h-[18px] w-[18px]" />
            </Link>
            <button type="button" className={cn("grid h-10 w-10 place-items-center rounded-full", infoOpen ? "bg-[#efe8ff] text-[#7c5cfc]" : "text-[#6d7871]")} onClick={() => setInfoOpen((v) => !v)} aria-label="Group info">
              <IconMore className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>

        <div className="ws-scroll min-h-0 flex-1 space-y-5 overflow-auto px-3 py-4 md:px-6">
          {days.map((group) => (
            <div key={group.label}>
              <p className="mb-4 text-center text-[11px] text-[#9aa39c]">{group.label}</p>
              <div className="space-y-3">
                {group.items.map((m) => {
                  const mine = m.userId === userId;
                  const name = mine ? "You" : m.author?.displayName || "Teammate";
                  const quoted = m.replyTo ? byId.get(m.replyTo) : null;
                  return (
                    <div key={m.id} className={cn("flex items-end gap-2", mine ? "justify-end" : "")}>
                      {!mine ? (
                        <span className="mb-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ddd6ff] text-[11px] font-semibold text-[#5b3fd6]">
                          {name.slice(0, 1)}
                        </span>
                      ) : null}
                      <div className="max-w-[min(100%,28rem)]">
                        <p className="mb-1 px-1 text-[11px] text-[#9aa39c]">{timeOf(m.createdAt)}</p>
                        <button
                          type="button"
                          className={cn(
                            "inline-block w-full rounded-[22px] px-3.5 py-2.5 text-left text-[13.5px] leading-6",
                            mine ? "rounded-br-md bg-[#3d8fe0] text-white" : "rounded-bl-md bg-white text-[#1e2a24] shadow-sm",
                            m.kind === "file" && !mine ? "bg-[#ffd6ef]" : "",
                            m.kind === "voice" && !mine ? "bg-[#ead9ff]" : "",
                          )}
                          onClick={() => setReplyTo(m)}
                        >
                          {quoted ? <span className="mb-2 block rounded-xl bg-black/10 px-2 py-1 text-[11px] opacity-80">Replied to: {quoted.body.slice(0, 72)}</span> : null}
                          {m.kind === "file" ? (
                            <span className="flex items-center gap-2">
                              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/70 text-[11px] font-bold text-[#7c5cfc]">FILE</span>
                              {m.fileName || m.body}
                            </span>
                          ) : m.kind === "voice" ? (
                            <span className="flex items-center gap-3">
                              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#1e2a24] text-white">▶</span>
                              <span className="h-6 flex-1 rounded-full bg-white/30" />
                              <span className="text-[11px]">{m.body.replace("Voice note ", "")}</span>
                            </span>
                          ) : (
                            m.body
                          )}
                        </button>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {m.reactions.map((r) => (
                            <button key={r.emoji} type="button" onClick={() => void react(m.id, r.emoji)} className={cn("rounded-full bg-white px-2 py-0.5 text-[11px] shadow-sm", r.mine ? "ring-1 ring-[#7c5cfc]" : "")}>
                              {r.emoji} {r.count}
                            </button>
                          ))}
                          <button type="button" className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] text-[#8b938d]" onClick={() => void react(m.id, "👍")}>
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {messages.length === 0 ? <p className="py-16 text-center text-sm text-[#8b938d]">Send the first message to the team.</p> : null}
          <div ref={bottom} />
        </div>

        <div className="border-t border-white/80 bg-[#f6f3ff] px-3 py-3 pb-[5.25rem] md:px-5 lg:pb-3">
          {replyTo ? (
            <div className="mb-2 flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-[12px] text-[#5b655f]">
              <span className="truncate">Replying to {replyTo.body.slice(0, 60)}</span>
              <button type="button" onClick={() => setReplyTo(null)}>
                ×
              </button>
            </div>
          ) : null}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send({ body });
            }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <button type="button" onClick={() => setComposerOpen((v) => !v)} className="grid h-12 w-12 place-items-center rounded-full bg-[#7c5cfc] text-xl text-white shadow-sm" aria-label="More">
                +
              </button>
              {composerOpen ? (
                <div className="absolute bottom-14 left-0 z-10 flex w-40 flex-col rounded-[22px] bg-white p-2 shadow-lg">
                  <button type="button" className="rounded-full px-3 py-2 text-left text-[12px]" onClick={() => fileRef.current?.click()}>
                    Attach file
                  </button>
                  <button type="button" className="rounded-full px-3 py-2 text-left text-[12px]" onClick={() => void sendVoice()}>
                    Voice note
                  </button>
                </div>
              ) : null}
            </div>
            <input ref={fileRef} type="file" className="hidden" onChange={onFile} />
            <input value={body} onChange={(e) => setBody(e.target.value)} className="h-12 min-w-0 flex-1 rounded-full bg-white px-4 text-[13.5px] outline-none ring-1 ring-[#eee8ff]" placeholder={`Message ${channelName}…`} maxLength={4000} />
            <button type="submit" className="grid h-12 w-12 place-items-center rounded-full bg-[#1b6754] text-white disabled:opacity-40" disabled={!body.trim()} aria-label="Send">
              <IconSend className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>

      {infoOpen ? (
        <aside className="absolute inset-0 z-50 flex flex-col bg-white xl:static xl:z-0 xl:w-[300px] xl:border-l xl:border-[#eee8ff]">
          <div className="flex items-center justify-between px-4 py-3 xl:hidden">
            <p className="text-sm font-semibold">Group info</p>
            <button type="button" className="rounded-full bg-[#f4f6f2] px-3 py-1.5 text-xs" onClick={() => setInfoOpen(false)}>
              Close
            </button>
          </div>
          <div className="ws-scroll flex-1 overflow-auto px-5 pb-8 pt-4">
            <div className="flex flex-col items-center text-center">
              <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-[#7c5cfc] to-[#3d8fe0] text-2xl font-semibold text-white">
                {channelName.slice(0, 1)}
              </span>
              <h2 className="mt-3 text-[17px] font-semibold">{channelName}</h2>
              <p className="mt-1 text-[12px] text-[#8b938d]">{online} members</p>
            </div>
            <p className="mt-6 text-[13px] leading-6 text-[#5b655f]">Team channel for briefs, replies, files, and voice notes.</p>
            <label className="mt-6 flex items-center justify-between rounded-2xl bg-[#f6f3ff] px-3 py-3">
              <span className="flex items-center gap-2 text-[13px]">
                <IconBell className="h-4 w-4 text-[#8b938d]" /> Notifications
              </span>
              <button type="button" role="switch" aria-checked={notify} onClick={() => setNotify((v) => !v)} className={cn("relative h-6 w-11 rounded-full", notify ? "bg-[#7c5cfc]" : "bg-[#d5dbd4]")}>
                <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm", notify ? "left-5" : "left-0.5")} />
              </button>
            </label>
            <p className="mt-6 flex items-center gap-2 text-[12px] text-[#8b938d]">
              <IconImage className="h-4 w-4" /> Media · {messages.filter((m) => m.kind === "file").length}
            </p>
            <p className="mt-3 flex items-center gap-2 text-[12px] text-[#8b938d]">
              <IconFolder className="h-4 w-4" /> Files
            </p>
            <Link href="/ws/meet" className="mt-6 flex h-11 items-center justify-center rounded-full bg-[#1b6754] text-[13px] font-medium text-white">
              Start a video meeting
            </Link>
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function groupByDay(messages: WorkspaceMessage[]) {
  const map = new Map<string, WorkspaceMessage[]>();
  for (const m of messages) {
    const label = new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const list = map.get(label) ?? [];
    list.push(m);
    map.set(label, list);
  }
  return [...map.entries()].map(([label, items]) => ({ label, items }));
}
