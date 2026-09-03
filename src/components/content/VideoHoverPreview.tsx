"use client";

import { useState } from "react";
import Image from "next/image";

export function VideoHoverPreview({
  src,
  poster,
}: {
  src: string;
  poster?: string | null;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div className="absolute inset-0" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {hover ? (
        <video src={src} muted playsInline autoPlay loop preload="none" className="h-full w-full object-cover" />
      ) : poster ? (
        <Image src={poster} alt="" fill sizes="33vw" className="object-cover" />
      ) : (
        <div className="h-full bg-gradient-to-br from-[var(--primary)]/25 to-[var(--accent)]/10" />
      )}
    </div>
  );
}
