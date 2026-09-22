"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Video } from "lucide-react";
import type { WorkspaceMeeting } from "@/lib/data/workspace";
import { EmptyState } from "@/components/workspace/EmptyState";
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
    <div className="ws-scroll h-full overflow-auto p-[var(--ws-space-4)] sm:p-[var(--ws-space-6)]">
      <div className="mb-[var(--ws-space-6)] flex items-center justify-between">
        <div>
          <h1 className="text-[length:var(--ws-type-xl)]">Office</h1>
          <p className="text-[length:var(--ws-type-xs)] text-[var(--theme-darker-color)]">{peers.length ? peers.join(", ") : "No one in lobby"}</p>
        </div>
      </div>
      <form onSubmit={(e) => void create(e)} className="mb-[var(--ws-space-6)] flex flex-wrap gap-[var(--ws-space-2)]">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="ws-input min-w-0 flex-1" />
        <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="ws-input min-w-0 w-full sm:w-auto" />
        <button type="submit" disabled={loading} className="ws-btn ws-btn-primary">
          {loading ? <span className="ws-spinner" /> : "Create room"}
        </button>
      </form>
      {meetings.length === 0 ? (
        <EmptyState icon={<Video className="h-5 w-5" strokeWidth={1.75} />} title="No rooms" body="Create a room for dailies, client review, or a quick standup." />
      ) : (
        <div className="divide-y divide-[var(--theme-divider-color)] border-y border-[var(--theme-divider-color)]">
          {meetings.map((m) => (
            <a key={m.id} href={`/ws/meet/${m.id}`} className="ws-row flex items-center justify-between py-[var(--ws-space-3)] text-[length:var(--ws-type-sm)] hover:bg-[var(--theme-navpanel-hovered)]">
              <span>{m.title}</span>
              <span className="text-[length:var(--ws-type-xs)] text-[var(--theme-darker-color)]">{new Date(m.startsAt).toLocaleString("en-US")}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
