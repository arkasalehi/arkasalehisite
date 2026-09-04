"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { TocItem } from "@/lib/toc";

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    if (!items.length) return;
    const els = items.map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "0px 0px -65% 0px", threshold: [0, 0.25, 1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav className="surface sticky top-24 hidden max-h-[70vh] overflow-auto p-4 lg:block" aria-label="فهرست">
      <p className="text-xs font-medium text-muted">فهرست مطلب</p>
      <ul className="mt-3 space-y-1 border-r border-[var(--border)] pr-3 text-sm">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "pr-3" : ""}>
            <a
              href={`#${item.id}`}
              className={cn(
                "block rounded-md py-1 text-muted transition hover:text-foreground",
                active === item.id && "text-accent",
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
