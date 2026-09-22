"use client";

import Link from "next/link";
import { JitsiRoom } from "@/components/workspace/JitsiRoom";
import { useOfficePresence } from "@/components/workspace/useOfficePresence";

export function MeetingStage({
  title,
  subtitle,
  roomName,
  displayName,
}: {
  title: string;
  subtitle: string;
  roomName: string;
  displayName: string;
}) {
  const peers = useOfficePresence(roomName, displayName);
  const hash = [
    `userInfo.displayName="${encodeURIComponent(displayName)}"`,
    "config.prejoinPageEnabled=false",
    "config.disableDeepLinking=true",
  ].join("&");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-10 items-center gap-3 border-b border-[var(--theme-divider-color)] px-3 text-[13px]">
        <Link href="/ws/meet" className="text-[var(--theme-darker-color)]">
          Office
        </Link>
        <span className="text-[var(--theme-caption-color)]">{title}</span>
        <span className="ml-auto truncate text-[11px] text-[var(--theme-darker-color)]">
          {subtitle} · {peers.length ? peers.join(", ") : displayName}
        </span>
        <Link href="/ws/meet" className="text-[12px] text-[#ff6359]">
          Leave
        </Link>
      </div>
      <div className="min-h-0 flex-1 bg-black">
        <JitsiRoom roomName={roomName} displayName={displayName} hash={hash} />
      </div>
    </div>
  );
}
