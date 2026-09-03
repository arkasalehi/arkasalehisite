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
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent">
      <div
        className="h-full origin-right bg-gradient-to-l from-[var(--accent)] to-[var(--primary)]"
        style={{ transform: `scaleX(${p})` }}
      />
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
    "sticky top-0 z-40 border-b transition-[background,backdrop-filter,border-color] duration-[var(--transition-normal)]",
    scrolled
      ? "border-[var(--border)] bg-background/75 backdrop-blur-xl"
      : "border-transparent bg-background/40 backdrop-blur-md",
  );
}
