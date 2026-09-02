"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export function VideoPlayer({
  src,
  poster,
  autoPlayInView = false,
  vertical = false,
  className,
  resumeKey,
  miniPlayer = false,
  hoverPreview = false,
}: {
  src: string;
  poster?: string | null;
  autoPlayInView?: boolean;
  vertical?: boolean;
  className?: string;
  resumeKey?: string;
  miniPlayer?: boolean;
  hoverPreview?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState(1);
  const [mini, setMini] = useState(false);
  const storageKey = resumeKey ? `as_video:${resumeKey}` : `as_video:${src}`;

  useEffect(() => {
    const el = ref.current;
    if (!el || hoverPreview) return;
    try {
      const saved = Number(localStorage.getItem(storageKey) || 0);
      if (saved > 1 && saved < (el.duration || Infinity) - 2) el.currentTime = saved;
    } catch {
      /* ignore */
    }
    const persist = () => {
      try {
        localStorage.setItem(storageKey, String(Math.floor(el.currentTime)));
      } catch {
        /* ignore */
      }
    };
    el.addEventListener("timeupdate", persist);
    return () => el.removeEventListener("timeupdate", persist);
  }, [storageKey, hoverPreview]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !autoPlayInView) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!el) return;
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.65 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [autoPlayInView]);

  useEffect(() => {
    if (!miniPlayer || autoPlayInView) return;
    const node = wrap.current;
    if (!node) return;
    const io = new IntersectionObserver(([entry]) => {
      const playing = ref.current && !ref.current.paused;
      setMini(!entry.isIntersecting && Boolean(playing));
    }, { threshold: 0.15 });
    io.observe(node);
    return () => io.disconnect();
  }, [miniPlayer, autoPlayInView]);

  function onEnter() {
    if (!hoverPreview) return;
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    el.play().catch(() => {});
  }

  function onLeave() {
    if (!hoverPreview) return;
    const el = ref.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }

  return (
    <div
      ref={wrap}
      className={cn(mini && "fixed bottom-20 left-4 z-40 w-56 shadow-2xl md:bottom-4")}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <video
        ref={ref}
        src={src}
        poster={poster ?? undefined}
        controls={!hoverPreview}
        playsInline
        preload={hoverPreview ? "none" : "metadata"}
        muted={autoPlayInView || hoverPreview}
        loop={autoPlayInView || hoverPreview}
        className={cn(
          "w-full bg-black object-cover",
          !className?.includes("absolute") &&
            (vertical ? "aspect-[9/16] max-h-[80vh] rounded-[var(--radius-lg)]" : "aspect-video rounded-[var(--radius-lg)]"),
          className,
        )}
      />
      {!autoPlayInView && !hoverPreview ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted">
          <span>سرعت</span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              className={cn("rounded-full px-2 py-0.5", speed === s ? "bg-foreground/10 text-accent" : "hover:text-foreground")}
              onClick={() => {
                setSpeed(s);
                if (ref.current) ref.current.playbackRate = s;
              }}
            >
              {s}×
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
