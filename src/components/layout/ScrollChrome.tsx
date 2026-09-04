"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ScrollProgress() {
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-px bg-transparent">
      <div className="h-full origin-right bg-foreground" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}

export function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

export function headerBlurClass(scrolled: boolean) {
  return cn(
    "sticky top-4 z-40 mx-auto w-[calc(100%-1.5rem)] max-w-[1100px] md:w-[calc(100%-5rem)]",
    scrolled && "[&>div]:shadow-[var(--shadow-nav)]",
  );
}
