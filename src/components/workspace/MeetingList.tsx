"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Video } from "lucide-react";
import type { WorkspaceMeeting } from "@/lib/data/workspace";
import { EmptyState } from "@/components/workspace/EmptyState";
import { createBrowserSupabase } from "@/lib/supabase/browser";

function RoomCount({ roomName }: { roomName: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let supabase: ReturnType<typeof createBrowserSupabase>;
    try {
      supabase = createBrowserSupabase();
    } catch {
      return;
    }
    const channel = supabase.channel(`arka-call:${roomName}`);
    const sync = () => setN(Object.keys(channel.presenceState()).length);
    channel.on("presence", { event: "sync" }, sync);
    void channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomName]);
  return <span>{n}/5 in call</span>;
}

export function MeetingList({ meetings }: { meetings: WorkspaceMeeting[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("Office room");
  const [loading, setLoading] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/workspace/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, startsAt: new Date().toISOString() }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok && data.id) router.push(`/ws/meet/${data.id}`);
  }

  return (
    <div className="ws-scroll h-full overflow-auto bg-[#0e1116] p-4 text-white">
      <h1 className="mb-1 text-[20px] font-semibold">Office</h1>
      <p className="mb-4 text-[12px] text-white/45">Pick a room to join the call. Camera stays off until you enter.</p>
      <form onSubmit={(e) => void create(e)} className="mb-4 flex gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="ws-input min-w-0 flex-1" placeholder="Room name" />
        <button type="submit" disabled={loading} className="ws-btn ws-btn-primary">
          {loading ? <span className="ws-spinner" /> : "New room"}
        </button>
      </form>
      {meetings.length === 0 ? (
        <EmptyState icon={<Video className="h-5 w-5" strokeWidth={1.75} />} title="No rooms" body="Create a room, then join when you are ready." />
      ) : (
        <div className="space-y-2">
          {meetings.map((m) => (
            <a key={m.id} href={`/ws/meet/${m.id}`} className="flex items-center justify-between rounded-2xl bg-[#1c2128] px-4 py-4 hover:bg-[#242a33]">
              <span className="min-w-0 truncate text-[15px]">{m.title}</span>
              <span className="shrink-0 text-[12px] text-white/40">
                <RoomCount roomName={m.roomName} />
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
