"use client";

import { useEffect, useRef, useState } from "react";
import { I18nProvider } from "@videojs/react/i18n";
import { HlsVideo } from "@videojs/react/media/hls-video";
import { Video, VideoPlayer, VideoSkin, usePlayer } from "@videojs/react/video";
import { cn } from "@/lib/utils";
import "@videojs/react/video/skin.css";
import "./videojs-shell.css";

function isHlsSource(src: string) {
  return /\.m3u8(\?|$)/i.test(src);
}

export function VideoJsClip({
  src,
  poster,
  vertical,
  className,
  resumeKey,
  miniPlayer,
  captions,
  title,
}: {
  src: string;
  poster?: string | null;
  vertical?: boolean;
  className?: string;
  resumeKey?: string;
  miniPlayer?: boolean;
  captions?: Array<{
    src: string;
    label: string;
    srclang?: string;
    default?: boolean;
  }>;
  title?: string;
}) {
  const shell = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [mini, setMini] = useState(false);
  const [playing, setPlaying] = useState(false);
  const fill = Boolean(className?.includes("absolute") || className?.includes("h-full"));
  const storageKey = resumeKey ? `as_video:${resumeKey}` : `as_video:${src}`;
  const Media = isHlsSource(src) ? HlsVideo : Video;
  const tracks = captions?.map((track) => (
    <track
      key={track.src}
      kind="captions"
      src={track.src}
      label={track.label}
      srcLang={track.srclang || "fa"}
      default={track.default}
    />
  ));

  useEffect(() => {
    const node = shell.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        io.disconnect();
      },
      { rootMargin: "240px", threshold: 0.05 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!miniPlayer || !visible) return;
    const node = shell.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setMini(!entry.isIntersecting && playing);
      },
      { threshold: 0.15 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [miniPlayer, visible, playing]);

  return (
    <div
      ref={shell}
      className={cn(
        "as-vjs-shell",
        fill && "is-fill",
        vertical && "is-vertical",
        mini && "fixed bottom-4 left-4 z-40 w-56 shadow-2xl",
        className,
      )}
    >
      {visible ? (
        <VideoPlayer key={src} poster={poster ?? undefined} title={title}>
          <I18nProvider locale="fa">
            <VideoSkin className="h-full w-full">
              <Media src={src} playsInline preload="metadata">
                {tracks}
              </Media>
              <ResumeClock storageKey={storageKey} />
              <PlaybackPulse onChange={setPlaying} />
            </VideoSkin>
          </I18nProvider>
        </VideoPlayer>
      ) : null}
    </div>
  );
}

function PlaybackPulse({ onChange }: { onChange: (playing: boolean) => void }) {
  const store = usePlayer();
  useEffect(() => {
    const sync = () => onChange(!store.paused);
    sync();
    return store.subscribe(sync);
  }, [onChange, store]);
  return null;
}

function ResumeClock({ storageKey }: { storageKey: string }) {
  const store = usePlayer();
  const restored = useRef(false);

  useEffect(() => {
    const restore = () => {
      if (restored.current || !store.target) return false;
      const duration = Number(store.duration ?? 0);
      if (duration <= 2) return false;
      try {
        const saved = Number(localStorage.getItem(storageKey) || 0);
        if (saved > 1 && saved < duration - 2) void store.seek(saved);
      } catch {
        /* ignore */
      }
      restored.current = true;
      return true;
    };
    if (restore()) return;
    const unsubscribe = store.subscribe(() => {
      if (restore()) unsubscribe();
    });
    return unsubscribe;
  }, [storageKey, store]);

  useEffect(() => {
    return store.subscribe(() => {
      if (!restored.current) return;
      const current = Number(store.currentTime ?? 0);
      if (current <= 1) return;
      try {
        localStorage.setItem(storageKey, String(Math.floor(current)));
      } catch {
        /* ignore */
      }
    });
  }, [storageKey, store]);

  return null;
}
