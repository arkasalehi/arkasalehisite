"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mic, MicOff, MonitorUp, PhoneOff, Video, VideoOff } from "lucide-react";
import { CallQualityBar } from "@/components/workspace/CallQualityBar";
import { VideoTile } from "@/components/workspace/VideoTile";
import { useCallRoom } from "@/components/workspace/useCallRoom";
import { formatCallClock } from "@/lib/workspace/callQuality";
import { cn } from "@/lib/utils";

export function MeetingStage({
  title,
  subtitle,
  roomName,
  userId,
  displayName,
}: {
  title: string;
  subtitle: string;
  roomName: string;
  userId: string;
  displayName: string;
}) {
  const call = useCallRoom(roomName, userId, displayName);
  const count = Math.max(call.peopleCount, call.peers.length + (call.localStream ? 1 : 0));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const elapsed = formatCallClock(now - call.sessionStartedAt);
  const names = [displayName, ...call.peers.map((p) => p.name)].filter(Boolean);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0c0c0c] text-white">
      <div className="flex min-h-10 shrink-0 items-center gap-3 overflow-hidden border-b border-white/10 px-3 text-[13px]">
        <Link href="/ws/meet" className="shrink-0 text-white/55 hover:text-white">
          Office
        </Link>
        <span className="min-w-0 truncate">{title}</span>
        <span className="ms-auto flex shrink-0 items-center gap-2 font-medium tabular-nums text-white/80">
          <span>
            {count}/{call.maxPeople} online
          </span>
          <span className="text-white/35">·</span>
          <span aria-label="Elapsed meeting time">{elapsed}</span>
        </span>
        <Link href="/ws/meet" onClick={() => call.hangUp()} className="shrink-0 text-[length:var(--ws-type-xs)] text-[var(--ws-status-cancelled)]">
          Leave
        </Link>
      </div>
      <p className="shrink-0 truncate border-b border-white/10 px-3 py-1 text-[length:var(--ws-type-xs)] text-white/45">
        {subtitle} · {names.join(", ")}
      </p>
      <div className="relative min-h-0 flex-1 p-[var(--ws-space-3)]">
        {call.error ? (
          <p className="grid h-full place-items-center text-center text-[length:var(--ws-type-sm)] text-white/70">{call.error}</p>
        ) : (
          <div
            className={cn(
              "grid h-full min-h-0 gap-[var(--ws-space-3)]",
              count <= 1 ? "grid-cols-1" : count === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            <VideoTile stream={call.localStream} muted camOn={call.camOn} you label={displayName} />
            {call.peers.map((peer) => (
              <VideoTile key={peer.id} stream={peer.stream} label={peer.name} />
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-[var(--ws-space-2)] border-t border-white/10 px-3 py-[var(--ws-space-3)] pb-[max(var(--ws-space-3),env(safe-area-inset-bottom))]">
        <button type="button" className="ws-btn bg-white/10 text-white hover:bg-white/16" onClick={call.toggleMic} aria-label={call.micOn ? "Mute" : "Unmute"}>
          {call.micOn ? <Mic className="h-4 w-4" strokeWidth={1.75} /> : <MicOff className="h-4 w-4" strokeWidth={1.75} />}
        </button>
        <button type="button" className="ws-btn bg-white/10 text-white hover:bg-white/16" onClick={call.toggleCam} aria-label={call.camOn ? "Stop camera" : "Start camera"}>
          {call.camOn ? <Video className="h-4 w-4" strokeWidth={1.75} /> : <VideoOff className="h-4 w-4" strokeWidth={1.75} />}
        </button>
        <button type="button" className={`ws-btn ${call.sharing ? "bg-[var(--ws-accent)] text-[var(--ws-on-accent)]" : "bg-white/10 text-white hover:bg-white/16"}`} onClick={() => void call.toggleShare()} aria-label="Share screen">
          <MonitorUp className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <Link href="/ws/meet" onClick={() => call.hangUp()} className="ws-btn bg-[var(--ws-status-cancelled)] text-white" aria-label="Leave">
          <PhoneOff className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </div>
      <CallQualityBar grade={call.grade} stats={call.stats} probe={call.probe} probing={call.probing} onRetest={() => void call.runProbe()} />
    </div>
  );
}
