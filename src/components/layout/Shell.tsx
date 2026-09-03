"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/Dropdown";
import { CartIcon, UserIcon } from "@/components/icons";
import { useAuth, useCart } from "@/components/providers";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { SearchBox } from "@/components/layout/SearchBox";
import { headerBlurClass, useScrolled } from "@/components/layout/ScrollChrome";
import type { SiteCms } from "@/lib/cms/types";

export function Header({ cms }: { cms: SiteCms }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { count } = useCart();
  const scrolled = useScrolled();

  return (
    <header className={headerBlurClass(scrolled)}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--primary)] text-sm font-bold text-white shadow-[0_0_20px_var(--glow)]">
            آ
          </span>
          <span className="text-lg font-semibold tracking-tight">{cms.seo.title || cms.hero.title}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm transition duration-200",
                  active ? "bg-foreground/8 text-accent" : "text-muted hover:bg-foreground/6 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <SearchBox />
          <ThemeToggle />
          <Link href="/cart" className="relative rounded-full p-2 text-muted transition duration-200 hover:bg-foreground/8 hover:text-foreground">
            <CartIcon />
            {count > 0 ? (
              <span className="absolute -left-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-slate-950">
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
                  <span className="rounded-full p-2 text-muted transition duration-200 hover:bg-foreground/8 hover:text-foreground">
                    <UserIcon />
                  </span>
                }
              >
                <Link href="/dashboard" className="block rounded-xl px-3 py-2 text-sm hover:bg-foreground/5">
                  داشبورد
                </Link>
                {user.role === "ADMIN" ? (
                  <Link href="/admin" className="block rounded-xl px-3 py-2 text-sm hover:bg-foreground/5">
                    پنل ادمین
                  </Link>
                ) : null}
                <Link href="/dashboard/saved" className="block rounded-xl px-3 py-2 text-sm hover:bg-foreground/5">
                  ذخیره‌ها
                </Link>
              </Dropdown>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm transition duration-200 hover:border-[var(--accent)]/40"
            >
              ورود
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer({ cms }: { cms: SiteCms }) {
  const links = cms.footer.links.length ? cms.footer.links : [...navItems];
  return (
    <footer className="mt-24 border-t border-[var(--border)] py-14">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 text-sm text-muted md:grid-cols-3">
        <div>
          <p className="text-base font-semibold text-foreground">{cms.hero.title}</p>
          <p className="mt-3 max-w-sm leading-8">{cms.about.bio}</p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {links.map((item) => (
            <Link key={`${item.href}-${item.label}`} href={item.href} className="transition hover:text-accent">
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3 md:justify-end">
          {cms.socials.map((s) => (
            <a key={s.href} href={s.href} className="transition hover:text-accent" rel="noreferrer">
              {s.label}
            </a>
          ))}
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl px-4 text-xs text-muted">
        © {new Date().getFullYear()} {cms.hero.title}
      </p>
    </footer>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-background/80 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-5 px-2 py-2">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("rounded-xl py-2 text-center text-xs transition", active ? "text-accent" : "text-muted")}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
