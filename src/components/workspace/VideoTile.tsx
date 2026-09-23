"use client";

import { useEffect, useRef } from "react";

export function VideoTile({
  stream,
  muted = false,
  label,
  you = false,
  camOn = true,
  avatarUrl = null,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
  you?: boolean;
  camOn?: boolean;
  avatarUrl?: string | null;
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

  return (
    <article className="relative aspect-[4/3] min-h-0 overflow-hidden rounded-2xl bg-[#14181e]">
      <video ref={ref} autoPlay playsInline muted={muted} className={`h-full w-full object-cover ${showVideo ? "" : "opacity-0"}`} />
      {!showVideo ? (
        <div className="absolute inset-0 grid place-items-center bg-[#171b21]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--ws-accent)] text-xl font-semibold text-[var(--ws-on-accent)]">
              {initial}
            </span>
          )}
        </div>
      ) : null}
      <span className="absolute bottom-2 start-2 rounded-md bg-black/55 px-2 py-0.5 text-[11px] text-white">{you ? `${label} (you)` : label}</span>
    </article>
  );
}
