"use client";

import { useState } from "react";
import { CoverImage } from "@/components/content/CoverImage";
import type { SampleKind } from "@/lib/media";

export function VideoHoverPreview({
  src,
  poster,
  seed = "video",
  kind = "video",
}: {
  src: string;
  poster?: string | null;
  seed?: string;
  kind?: SampleKind;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div className="absolute inset-0" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {hover ? (
        <video src={src} muted playsInline autoPlay loop preload="none" className="h-full w-full object-cover" />
      ) : (
        <CoverImage src={poster} alt="" seed={seed} kind={kind} sizes="33vw" />
      )}
    </div>
  );
}
