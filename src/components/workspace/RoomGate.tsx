"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { StudioRoom } from "@/lib/data/studio";
import { useWsChrome } from "@/lib/theme/workspace";

export function RoomGate({ meeting, userId }: { meeting: StudioRoom; userId: string }) {
  const { t } = useWsChrome();
  const router = useRouter();
  const [status, setStatus] = useState<"none" | "closed" | "pending" | "denied" | "locked">("none");

  useEffect(() => {
    let live = true;
    async function load() {
      if (meeting.kind === "project" || meeting.kind === "custom") {
        if (live) setStatus("locked");
        return;
      }
      if (!meeting.isOpen) {
        if (live) setStatus("closed");
        return;
      }
      const res = await fetch("/api/workspace/rooms");
      const data = (await res.json().catch(() => ({}))) as { requests?: Array<{ meeting_id: string; user_id: string; status: string }> };
      const mine = (data.requests ?? []).find((item) => item.meeting_id === meeting.id && item.user_id === userId);
      if (!live) return;
      if (mine?.status === "approved") {
        router.refresh();
        return;
      }
      if (!mine) setStatus("none");
      else setStatus(mine.status === "denied" ? "denied" : "pending");
    }
    void load();
    const id = window.setInterval(() => void load(), 4000);
    return () => {
      live = false;
      window.clearInterval(id);
    };
  }, [meeting.id, meeting.isOpen, meeting.kind, router, userId]);

  async function request() {
    await fetch("/api/workspace/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request", meetingId: meeting.id }),
    });
    setStatus("pending");
  }

  return (
    <div className="grid h-full place-items-center p-6 text-center">
      <div className="ws-card max-w-sm p-6">
        <h1 className="text-[18px] font-semibold">{meeting.title}</h1>
        <p className="mt-2 text-[13px] text-[var(--theme-darker-color)]">
          {status === "closed" ? t.roomClosed : status === "locked" ? t.locked : status === "denied" ? t.denied : status === "pending" ? t.waiting : t.requestJoin}
        </p>
        {meeting.kind === "personal" && meeting.isOpen && status !== "pending" ? (
          <button type="button" className="ws-btn ws-btn-primary mt-4" onClick={() => void request()}>
            {t.requestJoin}
          </button>
        ) : null}
      </div>
    </div>
  );
}
