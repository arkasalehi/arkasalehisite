"use client";

import { useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function VideoTile({
  stream,
  muted = false,
  label,
  you = false,
  youLabel = "You",
  camOn = true,
  avatarUrl = null,
  fill = false,
  wide = false,
  landscape = false,
  micOn = true,
  highlighted = false,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
  you?: boolean;
  youLabel?: string;
  camOn?: boolean;
  avatarUrl?: string | null;
  fill?: boolean;
  wide?: boolean;
  landscape?: boolean;
  micOn?: boolean;
  highlighted?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const videoTracks = stream?.getVideoTracks() ?? [];
  const liveVideo = videoTracks.some((t) => t.readyState === "live" && t.enabled !== false);
  const showVideo = Boolean(stream) && camOn && liveVideo;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    if (stream) void el.play().catch(() => undefined);
  }, [stream]);

  const initial = label.trim().slice(0, 1).toUpperCase() || "A";
  const name = you ? youLabel : label;

  return (
    <article
      className={cn(
        "relative min-h-0 overflow-hidden rounded-xl bg-[var(--ws-gray-4)]",
        fill
          ? wide
            ? "col-span-2 aspect-[3/2] w-full lg:col-span-1 lg:aspect-auto lg:h-full lg:min-h-0"
            : landscape
              ? "aspect-video w-full lg:aspect-auto lg:h-full lg:min-h-0"
              : "aspect-[3/4] w-full lg:aspect-auto lg:h-full lg:min-h-0"
          : "aspect-[4/3]",
        highlighted && "ring-2 ring-[var(--ws-accent)]",
      )}
    >
      <video ref={ref} autoPlay playsInline muted={muted} className={cn("absolute inset-0 h-full w-full object-cover", !showVideo && "opacity-0")} />
      {!showVideo ? (
        <div className="absolute inset-0 grid place-items-center bg-[var(--ws-gray-3)]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover sm:h-28 sm:w-28" />
          ) : (
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--ws-gray-5)] text-xl font-semibold text-[var(--theme-caption-color)] sm:h-20 sm:w-20 sm:text-2xl">{initial}</span>
          )}
        </div>
      ) : null}
      <span className="absolute bottom-2 start-2 rounded-md bg-black/55 px-2 py-0.5 text-[12px] text-white">{name}</span>
      <span className="absolute bottom-2 end-2 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white">
        {micOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
      </span>
    </article>
  );
}
