"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { WorkspaceMeeting } from "@/lib/data/workspace";
import { useOfficePresence } from "@/components/workspace/useOfficePresence";

export function MeetingList({ meetings, displayName }: { meetings: WorkspaceMeeting[]; displayName: string }) {
  const router = useRouter();
  const peers = useOfficePresence("lobby", displayName);
  const [title, setTitle] = useState("Office room");
  const [startsAt, setStartsAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [loading, setLoading] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/workspace/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, startsAt: new Date(startsAt).toISOString() }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok && data.id) router.push(`/ws/meet/${data.id}`);
  }

  return (
    <div className="ws-scroll h-full overflow-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-medium">Office</h1>
          <p className="text-[12px] text-[var(--theme-darker-color)]">{peers.length ? peers.join(", ") : "No one in lobby"}</p>
        </div>
      </div>
      <form onSubmit={(e) => void create(e)} className="mb-6 flex flex-wrap gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 rounded-md bg-[var(--input-BackgroundColor)] px-3 text-[13px] outline-none" />
        <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="h-8 rounded-md bg-[var(--input-BackgroundColor)] px-3 text-[13px] outline-none" />
        <button type="submit" disabled={loading} className="h-8 rounded-md bg-[var(--button-primary-BackgroundColor)] px-3 text-[12px] font-medium text-white">
          Create room
        </button>
      </form>
      <div className="divide-y divide-[var(--theme-divider-color)] border-y border-[var(--theme-divider-color)]">
        {meetings.map((m) => (
          <a key={m.id} href={`/ws/meet/${m.id}`} className="flex items-center justify-between py-3 text-[13px] hover:bg-[var(--theme-navpanel-hovered)]">
            <span>{m.title}</span>
            <span className="text-[11px] text-[var(--theme-darker-color)]">{new Date(m.startsAt).toLocaleString("en-US")}</span>
          </a>
        ))}
        {meetings.length === 0 ? <p className="py-8 text-[13px] text-[var(--theme-darker-color)]">No rooms yet.</p> : null}
      </div>
    </div>
  );
}
