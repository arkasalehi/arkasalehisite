"use client";

import { useState } from "react";
import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/Dropdown";
import { CartIcon, CloseIcon, MenuIcon, UserIcon } from "@/components/icons";
import { canAccessWorkspace, isAdminRole } from "@/lib/auth/roles";
import { workspaceUrl } from "@/lib/runtime";
import { useAuth, useCart } from "@/components/providers";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { SearchBox } from "@/components/layout/SearchBox";
import { headerClass } from "@/components/layout/ScrollChrome";
import { Button } from "@/components/ui/Button";
import type { SiteCms } from "@/lib/cms/types";

export function Header({ cms }: { cms: SiteCms }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  if (pathname === "/") return null;

  return (
    <header className={headerClass()}>
      <div className="flex h-14 items-center justify-between gap-3 rounded-full border border-border bg-[var(--glass)] px-3 shadow-[var(--shadow-nav)] backdrop-blur-xl md:h-16 md:px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2 px-1" aria-label={cms.seo.title || "arkasalehi"}>
          <span className="grid h-8 w-8 place-items-center rounded-[9px] border border-accent/30 text-[15px] font-semibold text-accent">
            ×
          </span>
          <span className="text-[16px] font-semibold tracking-tight text-foreground">آرکا صالحی</span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition-colors duration-150",
                  active ? "bg-accent/10 font-semibold text-accent" : "font-medium text-muted hover:text-foreground",
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
              <span className="absolute -left-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#3390ec] px-1 text-[10px] font-medium text-white">
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
                {canAccessWorkspace(user.role) ? (
                  <a href={workspaceUrl()} className="block rounded-md px-3 py-2 text-sm hover:bg-foreground/5">
                    ورک‌اسپیس
                  </a>
                ) : null}
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
        <div className="mt-2 overflow-hidden rounded-[24px] border border-border bg-[var(--glass)] p-3 shadow-[var(--shadow-nav)] backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col">
            {navItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn("rounded-xl px-3 py-2.5 text-sm", active ? "bg-accent/10 font-semibold text-accent" : "text-muted")}
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
    <footer className="mt-10 border-t border-border bg-[var(--footer)] text-foreground md:mt-12">
      <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 py-14 md:grid-cols-12 md:px-12">
        <div className="md:col-span-5">
          <p className="text-[22px] font-semibold tracking-tight text-foreground">آرکا صالحی</p>
          <p className="mt-3 max-w-sm text-sm leading-7 text-muted">{cms.about.bio}</p>
          <form
            className="mt-6 flex max-w-sm items-center gap-2 rounded-full border border-border bg-card p-1 shadow-[var(--shadow-card)]"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="ایمیل برای خبرنامه"
              className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted"
              aria-label="ایمیل خبرنامه"
            />
            <button type="submit" className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">
              عضویت
            </button>
          </form>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 md:col-span-7">
          <FooterCol title="پلتفرم" items={platform} />
          <FooterCol title="محتوا" items={content} />
          <FooterCol title="قانونی" items={legal.length ? legal : [{ href: "mailto:hello@arkasalehi.ir", label: "تماس" }]} />
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-12">
          <p className="text-xs text-muted">© {new Date().getFullYear()} آرکا صالحی</p>
          <div className="flex items-center gap-4 text-muted">
            {cms.socials.map((s) => (
              <a key={`${s.href}-${s.label}`} href={s.href} className="text-xs transition-colors hover:text-accent" rel="noreferrer">
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
      <p className="text-xs font-semibold text-muted">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => {
          const cls = "text-sm text-foreground transition-colors hover:text-accent";
          return (
            <li key={`${item.href}-${item.label}`}>
              {item.href.startsWith("http") || item.href.startsWith("mailto:") ? (
                <a href={item.href} className={cls} rel="noreferrer">
                  {item.label}
                </a>
              ) : (
                <Link href={item.href} className={cls}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
