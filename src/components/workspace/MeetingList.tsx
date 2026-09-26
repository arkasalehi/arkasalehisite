"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Video } from "lucide-react";
import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import type { WorkspaceMeeting } from "@/lib/data/workspace";
import { EmptyState } from "@/components/workspace/EmptyState";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { useWsChrome } from "@/lib/theme/workspace";

type Person = { id: string; name: string; avatar: string | null };

function useRoomPeople(roomName: string) {
  const [people, setPeople] = useState<Person[]>([]);

  useEffect(() => {
    let supabase: ReturnType<typeof createBrowserSupabase>;
    try {
      supabase = createBrowserSupabase();
    } catch {
      return;
    }
    const channel = supabase.channel(`arka-call:${roomName}`);
    const sync = () => {
      const state = channel.presenceState() as Record<string, Array<{ id?: string; name?: string; avatar?: string | null }>>;
      const map = new Map<string, Person>();
      for (const metas of Object.values(state)) {
        for (const meta of metas) {
          const id = String(meta.id || meta.name || "").trim();
          if (!id || map.has(id)) continue;
          map.set(id, { id, name: meta.name || "Guest", avatar: meta.avatar ?? null });
        }
      }
      setPeople([...map.values()]);
    };
    channel.on("presence", { event: "sync" }, sync);
    channel.on("presence", { event: "join" }, sync);
    channel.on("presence", { event: "leave" }, sync);
    void channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomName]);

  return people;
}

function Face({ person }: { person: Person }) {
  const initial = person.name.trim().slice(0, 1).toUpperCase() || "?";
  return (
    <span className="relative inline-grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--theme-navpanel-hovered)] text-[13px] font-semibold ring-2 ring-[var(--theme-comp-header-color)]" title={person.name}>
      {person.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.avatar} alt={person.name} className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}

function RoomCard({ meeting }: { meeting: WorkspaceMeeting }) {
  const people = useRoomPeople(meeting.roomName);
  const { t } = useWsChrome();
  const shown = people.slice(0, 5);
  const extra = people.length - shown.length;

  return (
    <Link
      href={`/ws/meet/${meeting.id}`}
      className="ws-card flex flex-col gap-4 transition-colors hover:bg-[var(--theme-navpanel-hovered)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 truncate text-[16px] font-semibold">{meeting.title}</h2>
        <span className="shrink-0 text-[12px] text-[var(--theme-darker-color)]">{people.length}/5</span>
      </div>
      {people.length ? (
        <div className="flex items-center">
          <div className="flex items-center -space-x-2">
            {shown.map((person) => (
              <Face key={person.id} person={person} />
            ))}
          </div>
          {extra > 0 ? <span className="ms-2 text-[12px] text-[var(--theme-darker-color)]">+{extra}</span> : null}
        </div>
      ) : (
        <p className="text-[12px] text-[var(--theme-darker-color)]">{t.noOneOnline}</p>
      )}
    </Link>
  );
}

export function MeetingList({ meetings }: { meetings: WorkspaceMeeting[] }) {
  const router = useRouter();
  const { t } = useWsChrome();
  const [title, setTitle] = useState("");
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
    <div className="ws-scroll h-full overflow-auto bg-[var(--theme-bg-color)] p-4 text-[var(--theme-caption-color)]">
      <h1 className="mb-1 text-[20px] font-semibold">{t.office}</h1>
      <p className="mb-4 text-[12px] text-[var(--theme-darker-color)]">{t.pickRoom}</p>
      <form onSubmit={(e) => void create(e)} className="mb-4 flex gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="ws-input min-w-0 flex-1" placeholder={t.roomName} required />
        <button type="submit" disabled={loading} className="ws-btn ws-btn-primary">
          {loading ? <span className="ws-spinner" /> : t.newRoom}
        </button>
      </form>
      {meetings.length === 0 ? (
        <EmptyState icon={<Video className="h-5 w-5" strokeWidth={1.75} />} title={t.emptyOfficeTitle} body={t.emptyOfficeBody} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {meetings.map((m) => (
            <RoomCard key={m.id} meeting={m} />
          ))}
        </div>
      )}
    </div>
  );
}
