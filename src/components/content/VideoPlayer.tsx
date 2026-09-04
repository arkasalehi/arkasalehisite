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
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSpeed, setShowSpeed] = useState(false);
  const storageKey = resumeKey ? `as_video:${resumeKey}` : `as_video:${src}`;
  const custom = !hoverPreview && !autoPlayInView;

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
    const onTime = () => {
      persist();
      if (el.duration) setProgress(el.currentTime / el.duration);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
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
    const io = new IntersectionObserver(
      ([entry]) => {
        const isPlaying = ref.current && !ref.current.paused;
        setMini(!entry.isIntersecting && Boolean(isPlaying));
      },
      { threshold: 0.15 },
    );
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

  function togglePlay() {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  }

  return (
    <div
      ref={wrap}
      className={cn(
        "group relative",
        (className?.includes("h-full") || className?.includes("absolute")) && "h-full",
        mini && "fixed bottom-20 left-4 z-40 w-56 shadow-2xl md:bottom-4",
      )}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <video
        ref={ref}
        src={src}
        poster={poster ?? undefined}
        controls={hoverPreview ? false : autoPlayInView}
        playsInline
        preload={hoverPreview ? "none" : "metadata"}
        muted={autoPlayInView || hoverPreview}
        loop={autoPlayInView || hoverPreview}
        onClick={custom ? togglePlay : undefined}
        className={cn(
          "w-full bg-black object-cover",
          !className?.includes("absolute") &&
            (vertical ? "aspect-[9/16] max-h-[80vh] rounded-2xl" : "aspect-video rounded-2xl"),
          className,
        )}
      />
      {custom ? (
        <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-black/55 p-2.5 text-white opacity-0 backdrop-blur-md transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={(e) => {
              const el = ref.current;
              if (!el?.duration) return;
              el.currentTime = Number(e.target.value) * el.duration;
            }}
            className="w-full accent-white"
            aria-label="پیشرفت پخش"
          />
          <div className="mt-1 flex items-center justify-between gap-2 text-xs">
            <button type="button" onClick={togglePlay} className="rounded-full px-3 py-1 hover:bg-white/10">
              {playing ? "توقف" : "پخش"}
            </button>
            <div className="relative">
              <button type="button" onClick={() => setShowSpeed((v) => !v)} className="rounded-full px-3 py-1 hover:bg-white/10">
                {speed}×
              </button>
              {showSpeed ? (
                <div className="absolute bottom-8 left-0 rounded-xl border border-white/10 bg-black/80 p-1">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={cn("block w-full rounded-lg px-3 py-1 text-right", speed === s && "text-white")}
                      onClick={() => {
                        setSpeed(s);
                        if (ref.current) ref.current.playbackRate = s;
                        setShowSpeed(false);
                      }}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
