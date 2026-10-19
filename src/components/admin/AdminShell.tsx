"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "نمای کلی" },
  { href: "/admin/posts?type=BLOG", label: "نوشته‌ها" },
  { href: "/admin/posts?type=VIDEO", label: "ویدیوها" },
  { href: "/admin/pricing", label: "قیمت‌ها" },
  { href: "/admin/messages", label: "پیام‌ها" },
  { href: "/admin/comments", label: "نظرها" },
  { href: "/admin/team", label: "کاربران" },
  { href: "/admin/settings", label: "تنظیمات" },
];

function active(href: string, pathname: string, type: string | null) {
  const url = new URL(href, "http://local");
  if (url.pathname === "/admin") return pathname === "/admin";
  if (url.pathname === "/admin/posts") {
    const onPosts = pathname === "/admin/posts" || pathname.startsWith("/admin/posts/");
    if (!onPosts) return false;
    return url.searchParams.get("type") === "VIDEO" ? type === "VIDEO" : type !== "VIDEO";
  }
  return pathname === url.pathname || pathname.startsWith(`${url.pathname}/`);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const type = useSearchParams().get("type");
  return (
    <nav className="flex flex-col gap-1" aria-label="مدیریت">
      {LINKS.map((item) => {
        const on = active(item.href, pathname, type);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={on ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition-colors duration-200",
              on ? "bg-[color-mix(in_srgb,var(--brand)_16%,transparent)] font-medium text-foreground" : "text-muted hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex min-h-dvh bg-[var(--bg)] text-foreground">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-e border-border bg-card lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--brand)] text-[14px] font-semibold text-[var(--brand-fg)]">آ</span>
          <span className="text-sm font-semibold">استودیو</span>
        </div>
        <div className="flex-1 overflow-auto p-3">
          <Suspense>
            <NavLinks />
          </Suspense>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] px-4 backdrop-blur-md lg:px-6">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-md lg:hidden"
            aria-label="منوی مدیریت"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <MenuIcon />
          </button>
          <p className="text-sm font-medium">مدیریت سایت</p>
          <Link href="/" className="ms-auto text-sm text-muted hover:text-foreground">
            مشاهده سایت
          </Link>
        </header>
        <div className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6 lg:px-8">{children}</div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="بستن منو" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 flex w-[min(100%,18rem)] flex-col bg-card shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <span className="text-sm font-semibold">استودیو</span>
              <button type="button" className="grid h-9 w-9 place-items-center" aria-label="بستن" onClick={() => setOpen(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3">
              <Suspense>
                <NavLinks onNavigate={() => setOpen(false)} />
              </Suspense>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
