"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function DashNav({
  items,
  title,
}: {
  items: Array<{ href: string; label: string }>;
  title?: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="glass h-fit rounded-3xl p-3 md:sticky md:top-24 md:w-56">
      {title ? <p className="mb-2 hidden px-3 pt-2 text-xs text-muted md:block">{title}</p> : null}
      <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-2xl px-3 py-2 text-sm transition duration-200",
                active ? "bg-[var(--primary)]/20 text-accent" : "text-muted hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
