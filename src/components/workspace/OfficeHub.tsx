"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Video } from "lucide-react";
import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { ChatAvatar } from "@/components/workspace/ChatAvatar";
import { EmptyState } from "@/components/workspace/EmptyState";
import { isAdminRole } from "@/lib/auth/roles";
import type { ChatPerson } from "@/lib/data/workspace";
import type { StudioProject, StudioRoom } from "@/lib/data/studio";
import { chatAvatarColor } from "@/lib/workspace/chat";
import { useWsChrome } from "@/lib/theme/workspace";

type JoinRequest = { id: string; meeting_id: string; user_id: string; status: string };

export function OfficeHub({
  rooms,
  projects,
  people,
  userId,
  role,
}: {
  rooms: StudioRoom[];
  projects: StudioProject[];
  people: ChatPerson[];
  userId: string;
  role: string;
}) {
  const { t } = useWsChrome();
  const router = useRouter();
  const admin = isAdminRole(role);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [title, setTitle] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([userId]);
  const names = new Map(people.map((person) => [person.id, person]));
  const mine = rooms.find((room) => room.kind === "personal" && room.ownerId === userId);
  const projectsRooms = rooms.filter((room) => room.kind === "project");
  const dedicated = rooms.filter((room) => room.kind === "custom");
  const others = rooms.filter((room) => room.kind === "personal" && room.ownerId !== userId && room.isOpen);

  useEffect(() => {
    let live = true;
    async function load() {
      const res = await fetch("/api/workspace/rooms");
      const data = (await res.json().catch(() => ({}))) as { requests?: JoinRequest[] };
      if (live && res.ok && Array.isArray(data.requests)) setRequests(data.requests);
    }
    void load();
    const id = window.setInterval(() => void load(), 8000);
    return () => {
      live = false;
      window.clearInterval(id);
    };
  }, []);

  async function act(body: Record<string, unknown>) {
    await fetch("/api/workspace/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
    const res = await fetch("/api/workspace/rooms");
    const data = (await res.json().catch(() => ({}))) as { requests?: JoinRequest[] };
    if (res.ok && Array.isArray(data.requests)) setRequests(data.requests);
  }

  const incoming = requests.filter((item) => item.meeting_id === mine?.id && item.status === "pending");

  return (
    <div className="ws-scroll h-full overflow-auto p-4">
      <h1 className="ws-title mb-4">{t.office}</h1>
      {mine ? (
        <section className="mb-4 ws-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{t.personalRoom}</p>
              <p className="text-[12px] text-[var(--theme-darker-color)]">{mine.isOpen ? t.activeNow : t.inactive}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="ws-btn ws-btn-ghost" onClick={() => void act({ action: "toggle", meetingId: mine.id, isOpen: !mine.isOpen })}>
                {mine.isOpen ? t.closeRoom : t.openRoom}
              </button>
              <Link href={`/ws/meet/${mine.id}`} className="ws-btn ws-btn-primary">
                {t.open}
              </Link>
            </div>
          </div>
          {incoming.length ? (
            <div className="mt-3 space-y-2">
              <p className="ws-label">{t.joinRequests}</p>
              {incoming.map((item) => {
                const person = names.get(item.user_id);
                return (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-[13px]">
                      <ChatAvatar name={person?.displayName ?? t.guest} url={person?.avatarUrl ?? null} color={chatAvatarColor(item.user_id)} size={28} />
                      {person?.displayName || person?.username || t.guest}
                    </span>
                    <span className="flex gap-2">
                      <button type="button" className="ws-btn ws-btn-primary" onClick={() => void act({ action: "decide", meetingId: mine.id, requestId: item.id, status: "approved" })}>
                        {t.allow}
                      </button>
                      <button type="button" className="ws-btn ws-btn-ghost" onClick={() => void act({ action: "decide", meetingId: mine.id, requestId: item.id, status: "denied" })}>
                        {t.deny}
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="mb-2 flex items-center justify-between">
        <h2 className="ws-label">{t.dedicatedRoom}</h2>
      </div>
      {admin ? (
        <form
          className="mb-4 space-y-3 ws-card"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            void act({ action: "create", title: title.trim(), memberIds }).then(() => {
              setTitle("");
              setMemberIds([userId]);
            });
          }}
        >
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="ws-input w-full" placeholder={t.newDedicatedRoom} required />
          <div className="flex flex-wrap gap-2">
            {people.filter((person) => person.id !== userId).map((person) => (
              <label key={person.id} className="flex items-center gap-2 rounded-full bg-[var(--input-BackgroundColor)] px-3 py-1 text-[12px]">
                <input type="checkbox" checked={memberIds.includes(person.id)} onChange={() => setMemberIds((prev) => (prev.includes(person.id) ? prev.filter((id) => id !== person.id) : [...prev, person.id]))} />
                {person.displayName || person.username}
              </label>
            ))}
          </div>
          <button type="submit" className="ws-btn ws-btn-primary">
            {t.newRoom}
          </button>
        </form>
      ) : null}
      {dedicated.length ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {dedicated.map((room) => {
            const allowed = admin || room.memberIds.includes(userId);
            return (
              <article key={room.id} className="ws-card">
                <p className="font-semibold">{room.title}</p>
                <p className="text-[12px] text-[var(--theme-darker-color)]">
                  {room.isOpen ? t.activeNow : t.locked} · {room.memberIds.length} {t.collaborators}
                </p>
                {admin ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {people.map((person) => (
                      <label key={person.id} className="text-[12px]">
                        <input
                          type="checkbox"
                          className="me-1"
                          checked={room.memberIds.includes(person.id)}
                          disabled={person.id === userId}
                          onChange={() => {
                            const next = room.memberIds.includes(person.id) ? room.memberIds.filter((id) => id !== person.id) : [...room.memberIds, person.id];
                            void act({ action: "members", meetingId: room.id, memberIds: next });
                          }}
                        />
                        {person.displayName || person.username}
                      </label>
                    ))}
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {admin ? (
                    <>
                      <button type="button" className="ws-btn ws-btn-ghost" onClick={() => void act({ action: "toggle", meetingId: room.id, isOpen: !room.isOpen })}>
                        {room.isOpen ? t.lock : t.unlock}
                      </button>
                      <button type="button" className="ws-btn ws-btn-ghost text-[var(--ws-status-cancelled)]" onClick={() => void act({ action: "delete", meetingId: room.id })}>
                        {t.clear}
                      </button>
                    </>
                  ) : null}
                  {admin || (allowed && room.isOpen) ? (
                    <Link href={`/ws/meet/${room.id}`} className="ws-btn ws-btn-primary">
                      {t.open}
                    </Link>
                  ) : (
                    <span className="self-center text-[12px] text-[var(--theme-darker-color)]">{t.locked}</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      <h2 className="ws-label mb-2">{t.projectRoom}</h2>
      {projectsRooms.length === 0 ? (
        <EmptyState icon={<Video className="h-5 w-5" />} title={t.emptyOfficeTitle} body={t.emptyOfficeBody} />
      ) : (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {projectsRooms.map((room) => {
            const project = projects.find((item) => item.id === room.projectId || item.meetingId === room.id);
            const canEnter = project?.status === "active" && room.isOpen;
            return (
              <article key={room.id} className="ws-card">
                <p className="font-semibold">{project?.name || room.title}</p>
                <p className="text-[12px] text-[var(--theme-darker-color)]">
                  {project?.members.length ?? 0} {t.collaborators}
                  {!room.isOpen ? ` · ${t.locked}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {admin ? (
                    <button type="button" className="ws-btn ws-btn-ghost" onClick={() => void act({ action: "toggle", meetingId: room.id, isOpen: !room.isOpen })}>
                      {room.isOpen ? t.lock : t.unlock}
                    </button>
                  ) : null}
                  {canEnter || admin ? (
                    <Link href={`/ws/meet/${room.id}`} className="ws-btn ws-btn-primary">
                      {t.open}
                    </Link>
                  ) : (
                    <p className="self-center text-[12px] text-[var(--theme-darker-color)]">{project?.status === "locked" || !room.isOpen ? t.locked : t.inactive}</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {others.length ? (
        <>
          <h2 className="ws-label mb-2">{t.people}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {others.map((room) => {
              const owner = names.get(room.ownerId ?? "");
              const mineReq = requests.find((item) => item.meeting_id === room.id && item.user_id === userId);
              return (
                <article key={room.id} className="ws-card">
                  <div className="flex items-center gap-3">
                    <ChatAvatar name={owner?.displayName ?? room.title} url={owner?.avatarUrl ?? null} color={chatAvatarColor(room.ownerId ?? room.id)} size={40} />
                    <div>
                      <p className="font-semibold">{owner?.displayName || room.title}</p>
                      <p className="text-[12px] text-[var(--theme-darker-color)]">{t.personalRoom}</p>
                    </div>
                  </div>
                  {mineReq?.status === "approved" ? (
                    <Link href={`/ws/meet/${room.id}`} className="ws-btn ws-btn-primary mt-3">
                      {t.open}
                    </Link>
                  ) : mineReq?.status === "pending" ? (
                    <p className="mt-3 text-[12px] text-[var(--theme-darker-color)]">{t.waiting}</p>
                  ) : (
                    <button type="button" className="ws-btn ws-btn-primary mt-3" onClick={() => void act({ action: "request", meetingId: room.id })}>
                      {t.requestJoin}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
