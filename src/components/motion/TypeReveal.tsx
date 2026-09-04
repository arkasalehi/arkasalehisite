"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type TagName = "h1" | "h2" | "h3" | "p" | "span";

export function TypeReveal({
  text,
  as: Tag = "span",
  className,
  delay = 40,
  msPerChar = 24,
  caret = true,
}: {
  text: string;
  as?: TagName;
  className?: string;
  delay?: number;
  msPerChar?: number;
  caret?: boolean;
}) {
  const glyphs = Array.from(text);
  const [count, setCount] = useState(0);
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(glyphs.length);
      setTyping(false);
      return;
    }

    setCount(0);
    setTyping(true);
    let raf = 0;
    let origin: number | null = null;
    let last = 0;

    const tick = (now: number) => {
      if (origin == null) origin = now + delay;
      const elapsed = now - origin;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const next = Math.min(glyphs.length, Math.floor(elapsed / msPerChar) + 1);
      if (next !== last) {
        last = next;
        setCount(next);
      }
      if (next >= glyphs.length) setTyping(false);
      else raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [delay, glyphs.length, msPerChar, text]);

  return (
    <Tag aria-label={text} className={cn("type-reveal", className)}>
      <span className="type-reveal-ghost" aria-hidden="true">
        {text}
      </span>
      <span className={cn("type-reveal-live", caret && typing && "is-typing")} aria-hidden="true">
        {glyphs.slice(0, count).join("")}
      </span>
    </Tag>
  );
}
