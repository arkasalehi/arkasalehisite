"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

export type CaptionTrack = {
  src: string;
  label: string;
  srclang?: string;
  default?: boolean;
};

const VideoJsClip = dynamic(() => import("@/components/content/VideoJsClip").then((m) => m.VideoJsClip), {
  ssr: false,
});

export function VideoPlayer({
  src,
  poster,
  autoPlayInView = false,
  vertical = false,
  className,
  resumeKey,
  miniPlayer = false,
  hoverPreview = false,
  captions,
  title,
}: {
  src: string;
  poster?: string | null;
  autoPlayInView?: boolean;
  vertical?: boolean;
  className?: string;
  resumeKey?: string;
  miniPlayer?: boolean;
  hoverPreview?: boolean;
  captions?: CaptionTrack[];
  title?: string;
}) {
  const native = hoverPreview || (autoPlayInView && vertical);
  if (native) {
    return (
      <NativeClip
        src={src}
        poster={poster}
        autoPlayInView={autoPlayInView}
        vertical={vertical}
        hoverPreview={hoverPreview}
        className={className}
      />
    );
  }
  return (
    <VideoJsClip
      src={src}
      poster={poster}
      vertical={vertical}
      className={className}
      resumeKey={resumeKey}
      miniPlayer={miniPlayer}
      captions={captions}
      title={title}
    />
  );
}

function NativeClip({
  src,
  poster,
  autoPlayInView,
  vertical,
  hoverPreview,
  className,
}: {
  src: string;
  poster?: string | null;
  autoPlayInView: boolean;
  vertical: boolean;
  hoverPreview: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !autoPlayInView) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.65 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [autoPlayInView]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster ?? undefined}
      controls={false}
      playsInline
      preload={hoverPreview ? "none" : "metadata"}
      muted={autoPlayInView || hoverPreview}
      loop={autoPlayInView || hoverPreview}
      onMouseEnter={() => {
        if (!hoverPreview) return;
        const el = ref.current;
        if (!el) return;
        el.muted = true;
        el.play().catch(() => {});
      }}
      onMouseLeave={() => {
        if (!hoverPreview) return;
        const el = ref.current;
        if (!el) return;
        el.pause();
        el.currentTime = 0;
      }}
      className={cn(
        "w-full bg-black object-cover",
        !className?.includes("absolute") &&
          (vertical ? "aspect-[9/16] max-h-[80vh] rounded-[1.75rem]" : "aspect-video rounded-[1.75rem]"),
        className,
      )}
    />
  );
}
