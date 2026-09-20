"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { publicSiteUrl } from "@/lib/runtime";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/ws", label: "نمای کلی" },
  { href: "/ws/chat", label: "چت" },
  { href: "/ws/meet", label: "جلسه و تماس" },
  { href: "/ws/tasks", label: "کارها" },
  { href: "/ws/calendar", label: "تقویم" },
];

export function WorkspaceShell({
  children,
  displayName,
  channels,
}: {
  children: React.ReactNode;
  displayName: string;
  channels: Array<{ id: string; slug: string; name: string }>;
}) {
  const pathname = usePathname();
  const site = publicSiteUrl();

  return (
    <div className="flex min-h-svh bg-[#f4f6f2] text-[#1e2a24]" dir="rtl">
      <aside className="hidden w-[220px] shrink-0 flex-col border-l border-[#e3e7e1] bg-[#eef1ea] px-3 py-4 lg:flex">
        <Link href="/ws" className="flex items-center gap-2 px-2 pb-4">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#1b6754] text-sm text-white">A</span>
          <span className="text-sm font-semibold">Workspace</span>
        </Link>
        <p className="px-2 text-[11px] text-[#8b938d]">فضا</p>
        <nav className="mt-1 space-y-0.5">
          {NAV.map((item) => {
            const active = item.href === "/ws" ? pathname === "/ws" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-xl px-2 py-1.5 text-[13px]",
                  active ? "bg-[#e7ebe4] font-medium" : "text-[#3d4741] hover:bg-white/70",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-5 px-2 text-[11px] text-[#8b938d]">کانال‌ها</p>
        <ul className="mt-1 space-y-0.5">
          {channels.map((ch) => (
            <li key={ch.id}>
              <Link
                href={`/ws/chat/${ch.id}`}
                className={cn(
                  "block rounded-xl px-2 py-1.5 text-[13px]",
                  pathname.includes(ch.id) ? "bg-white font-medium" : "text-[#3d4741] hover:bg-white/70",
                )}
              >
                # {ch.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto space-y-2 px-2 pt-6 text-[12px]">
          <p className="truncate text-[#5b655f]">{displayName}</p>
          <a href={site} className="block text-[#1b6754]">
            بازگشت به سایت
          </a>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-[#e3e7e1] bg-white/80 px-4 py-3 backdrop-blur">
          <Link href="/ws" className="text-sm font-semibold lg:hidden">
            Workspace
          </Link>
          <nav className="flex flex-wrap gap-2 text-[12px] lg:hidden">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full bg-[#f6f7f4] px-3 py-1">
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/ws/meet" className="inline-flex h-9 items-center rounded-full bg-[#1b6754] px-4 text-[12px] font-medium text-white">
            شروع تماس
          </Link>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
