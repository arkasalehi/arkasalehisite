"use client";

import { useEffect, useRef } from "react";

export function VideoTile({
  stream,
  muted = false,
  label,
  you = false,
  camOn = true,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
  you?: boolean;
  camOn?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const videoTracks = stream?.getVideoTracks() ?? [];
  const liveVideo = videoTracks.some((t) => t.readyState === "live");
  const showVideo = Boolean(stream) && camOn && (liveVideo || (!you && videoTracks.length > 0));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    if (stream) void el.play().catch(() => undefined);
  }, [stream]);

  const initial = label.trim().slice(0, 1).toUpperCase() || "A";

  return (
    <article className="relative min-h-48 overflow-hidden rounded-[var(--ws-radius)] bg-[#141414]">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full w-full object-contain bg-black ${showVideo ? "" : "opacity-0"}`}
      />
      {!showVideo ? (
        <div className="absolute inset-0 grid place-items-center bg-[#1a1a1a]">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--ws-accent)] text-lg font-semibold text-[var(--ws-on-accent)]">
            {initial}
          </span>
          {!you && !stream ? (
            <span className="absolute bottom-10 text-[length:var(--ws-type-xs)] text-white/55">Connecting…</span>
          ) : null}
        </div>
      ) : null}
      <span className="absolute bottom-2 start-2 rounded-[var(--ws-radius)] bg-black/55 px-2 py-0.5 text-[length:var(--ws-type-xs)] text-white">
        {you ? `${label} (you)` : label}
      </span>
    </article>
  );
}
