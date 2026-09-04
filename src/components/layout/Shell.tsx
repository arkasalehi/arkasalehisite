"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/Dropdown";
import { CartIcon, CloseIcon, MenuIcon, UserIcon } from "@/components/icons";
import { isAdminRole } from "@/lib/auth/roles";
import { useAuth, useCart } from "@/components/providers";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { SearchBox } from "@/components/layout/SearchBox";
import { headerBlurClass, useScrolled } from "@/components/layout/ScrollChrome";
import { Button } from "@/components/ui/Button";
import type { SiteCms } from "@/lib/cms/types";

export function Header({ cms }: { cms: SiteCms }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled();

  return (
    <header className={headerBlurClass(scrolled)}>
      <div className="flex h-14 items-center justify-between gap-3 rounded-full border border-[var(--border)] bg-[var(--glass)] px-3 shadow-[var(--shadow-nav)] backdrop-blur-xl md:h-16 md:px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2 px-1" aria-label={cms.seo.title || "arkasalehi"}>
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
          <span className="font-display text-[17px] font-medium tracking-tight md:text-[18px]">arkasalehi</span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition-colors duration-150",
                  active ? "font-semibold text-foreground" : "font-medium text-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-0.5">
          <SearchBox />
          <ThemeToggle />
          <Link
            href="/cart"
            className="relative rounded-full p-2 text-muted transition-colors duration-150 hover:text-foreground"
            aria-label="سبد خرید"
          >
            <CartIcon />
            {count > 0 ? (
              <span className="absolute -left-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] font-medium text-background">
                {count}
              </span>
            ) : null}
          </Link>
          {user ? (
            <>
              <NotificationBell />
              <Dropdown
                align="end"
                trigger={
                  <span className="rounded-full p-2 text-muted transition-colors duration-150 hover:text-foreground">
                    <UserIcon />
                  </span>
                }
              >
                <Link href="/dashboard" className="block rounded-md px-3 py-2 text-sm hover:bg-foreground/5">
                  داشبورد
                </Link>
                {isAdminRole(user.role) ? (
                  <Link href="/admin" className="block rounded-md px-3 py-2 text-sm hover:bg-foreground/5">
                    پنل ادمین
                  </Link>
                ) : null}
                <Link href="/dashboard/saved" className="block rounded-md px-3 py-2 text-sm hover:bg-foreground/5">
                  ذخیره‌ها
                </Link>
              </Dropdown>
            </>
          ) : (
            <Button href="/login" className="ms-1 hidden px-4 py-1.5 text-sm sm:inline-flex">
              ورود
            </Button>
          )}
          <button
            type="button"
            className="rounded-full p-2 text-foreground lg:hidden"
            aria-label={open ? "بستن منو" : "منو"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="mt-2 overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--glass)] p-3 shadow-[var(--shadow-nav)] backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col">
            {navItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm",
                    active ? "font-semibold text-foreground" : "text-muted",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            {!user ? (
              <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium">
                ورود
              </Link>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export function Footer({ cms }: { cms: SiteCms }) {
  const platform = [
    { href: "/", label: "خانه" },
    { href: "/dashboard", label: "داشبورد" },
    { href: "/login", label: "ورود" },
  ];
  const content = [...navItems.filter((item) => item.href !== "/")];
  const legal = cms.footer.links.filter((item) => !navItems.some((n) => n.href === item.href));

  return (
    <footer className="mt-24 bg-[var(--footer)] text-[#fafafa]">
      <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 py-16 md:grid-cols-12 md:px-20">
        <div className="md:col-span-5">
          <p className="font-display text-2xl font-medium tracking-tight">arkasalehi</p>
          <p className="mt-3 max-w-sm text-sm leading-7 text-white/60">{cms.about.bio}</p>
          <form
            className="mt-6 flex max-w-sm items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="ایمیل برای خبرنامه"
              className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-white/40"
              aria-label="ایمیل خبرنامه"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-black"
            >
              عضویت
            </button>
          </form>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 md:col-span-7">
          <FooterCol title="پلتفرم" items={platform} />
          <FooterCol title="محتوا" items={content} />
          <FooterCol
            title="قانونی"
            items={legal.length ? legal : [{ href: "mailto:hello@arkasalehi.ir", label: "تماس" }]}
          />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-20">
          <p className="text-xs text-white/45">© {new Date().getFullYear()} arkasalehi</p>
          <div className="flex items-center gap-4 text-white/55">
            {cms.socials.map((s) => (
              <a key={`${s.href}-${s.label}`} href={s.href} className="text-xs transition-colors hover:text-white" rel="noreferrer">
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: Array<{ href: string; label: string }> }) {
  return (
    <div>
      <p className="text-xs font-medium text-white/40">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={`${item.href}-${item.label}`}>
            {item.href.startsWith("http") || item.href.startsWith("mailto:") ? (
              <a href={item.href} className="text-sm text-white/70 transition-colors hover:text-white" rel="noreferrer">
                {item.label}
              </a>
            ) : (
              <Link href={item.href} className="text-sm text-white/70 transition-colors hover:text-white">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-4 bottom-3 z-40 md:hidden">
      <div className="grid grid-cols-5 rounded-full border border-[var(--border)] bg-[var(--glass)] px-1 py-1.5 shadow-[var(--shadow-nav)] backdrop-blur-xl">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full py-2 text-center text-[11px] transition-colors duration-150",
                active ? "font-semibold text-foreground" : "font-medium text-muted",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
