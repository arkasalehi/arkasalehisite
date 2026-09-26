"use client";

import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
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
      <aside className="surface h-fit rounded-[24px] p-2 md:sticky md:top-28 md:w-56">
      {title ? <p className="mb-1 hidden px-3 pt-2 text-xs font-medium text-muted md:block">{title}</p> : null}
      <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors duration-150",
                active ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground",
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
