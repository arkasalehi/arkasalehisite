"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { WorkspaceMeeting } from "@/lib/data/workspace";

export function MeetingList({ meetings }: { meetings: WorkspaceMeeting[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("Team meeting");
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
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <section className="space-y-3">
        {meetings.length === 0 ? <p className="text-sm text-[#8b938d]">No meetings yet. Create one and jump in.</p> : null}
        {meetings.map((m) => (
          <a key={m.id} href={`/ws/meet/${m.id}`} className="block rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-[#eef1ea]">
            <p className="font-medium">{m.title}</p>
            <p className="mt-1 text-xs text-[#8b938d]">
              {new Date(m.startsAt).toLocaleString("en-US")} · Jitsi
            </p>
          </a>
        ))}
      </section>
      <form onSubmit={create} className="space-y-3 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-[#eef1ea]">
        <h2 className="text-sm font-semibold">New meeting</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="field" placeholder="Title" />
        <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="field" />
        <Button type="submit" loading={loading} loadingLabel="Creating…" className="w-full bg-[#1b6754] text-white hover:opacity-90">
          Create and join
        </Button>
        <p className="text-[11px] leading-5 text-[#8b938d]">Video calls run on Jitsi Meet (free camera and screen share).</p>
      </form>
    </div>
  );
}
