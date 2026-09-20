"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";
import type { WorkspaceMessage } from "@/lib/data/workspace";

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
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initial);
  }, [initial, channelId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`workspace-chat:${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "workspace_messages", filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const row = payload.new as { id: string; channel_id: string; user_id: string; body: string; created_at: string };
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
                author: { displayName: row.user_id === userId ? "شما" : "همکار", username: "", avatarUrl: null },
              },
            ];
          });
        },
      )
      .on("presence", { event: "sync" }, () => {
        setOnline(Object.keys(channel.presenceState()).length || 1);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId, at: Date.now() });
        }
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelId, userId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setBody("");
    await fetch("/api/workspace/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId, body: text }),
    });
  }

  return (
    <div className="flex h-[calc(100svh-7.5rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#eef1ea] px-4 py-3">
        <h1 className="text-base font-semibold"># {channelName}</h1>
        <p className="text-xs text-[#8b938d]">{online} نفر آنلاین</p>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto px-4 py-4">
        {messages.map((m) => (
          <div key={m.id} className="rounded-xl bg-[#f6f7f4] px-3 py-2">
            <p className="text-[11px] text-[#8b938d]">
              {m.author?.displayName || "همکار"} · {new Date(m.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="mt-1 text-sm leading-6">{m.body}</p>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-[#eef1ea] p-3">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="field flex-1"
          placeholder="پیام به کانال…"
          maxLength={4000}
        />
        <Button type="submit">ارسال</Button>
      </form>
    </div>
  );
}
