"use client";

import { useEffect, useState } from "react";
import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
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
import { Button } from "@/components/ui/Button";
import type { SiteCms } from "@/lib/cms/types";

type NavLink = { href: string; title: string; body: string; external?: boolean };

const MENUS: Array<{ label: string; items: NavLink[] }> = [
  {
    label: "محصول",
    items: [
      { href: "/blog", title: "وبلاگ", body: "یادداشت‌های استودیو، با همان زبان کار روزمره." },
      { href: "/video", title: "ویدیو", body: "قاب‌های بلند و برش‌های برگزیده." },
      { href: "/shorts", title: "شورتس", body: "کلیپ‌های عمودی در یک ریل." },
      { href: "/products", title: "فروشگاه", body: "ابزارها و محصولات محدود استودیو." },
    ],
  },
  {
    label: "ورک‌اسپیس",
    items: [
      { href: workspaceUrl(), title: "استودیو", body: "تسک، چت، سند و جلسه در یک فضا.", external: true },
      { href: "/#how-it-works", title: "چطور کار می‌کند", body: "از برنامه‌ریزی تا انتشار، سه قدم." },
      { href: "/login", title: "ورود همکاران", body: "حساب همکار برای دسترسی به استودیو." },
    ],
  },
  {
    label: "منابع",
    items: [
      { href: "/#enterprise", title: "سازمانی", body: "ابزارهایی برای تیم‌هایی که کار را یکجا نگه می‌دارند." },
      { href: "/dashboard", title: "داشبورد", body: "ذخیره‌ها، فعالیت و تنظیمات حساب." },
      { href: "mailto:hello@arkasalehi.ir", title: "تماس", body: "hello@arkasalehi.ir", external: true },
    ],
  },
];

function Mark() {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--brand)] text-[14px] font-semibold text-[var(--brand-fg)]" aria-hidden>
      آ
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M5 7.5 10 12.5 15 7.5" />
    </svg>
  );
}

function MenuLink({ item, onClick }: { item: NavLink; onClick?: () => void }) {
  const cls = "block rounded-md px-3 py-2.5 transition-colors duration-200 hover:bg-foreground/5";
  const inner = (
    <>
      <span className="block text-[13px] font-medium text-foreground">{item.title}</span>
      <span className="mt-0.5 block text-[12px] leading-5 text-muted">{item.body}</span>
    </>
  );
  if (item.external || item.href.startsWith("mailto:") || item.href.startsWith("http")) {
    return (
      <a href={item.href} className={cls} onClick={onClick} rel="noreferrer">
        {inner}
      </a>
    );
  }
  return (
    <Link href={item.href} className={cls} onClick={onClick}>
      {inner}
    </Link>
  );
}

function NavMenu({ label, items }: { label: string; items: NavLink[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[14px] text-muted transition-colors duration-200 hover:text-foreground"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <Chevron open={open} />
      </button>
      {open ? (
        <div className="absolute start-0 top-full z-50 w-[300px] pt-2">
          <div className="rounded-lg border border-border bg-card p-1.5 shadow-2xl" role="menu">
            {items.map((item) => (
              <MenuLink key={`${item.href}-${item.title}`} item={item} onClick={() => setOpen(false)} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Header({ cms }: { cms: SiteCms }) {
  const { user } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string | null>(MENUS[0]?.label ?? null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="site-nav sticky top-0 z-40 border-b border-border bg-[color-mix(in_srgb,var(--bg)_86%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-3 px-4 md:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={cms.seo.title || "آرکا صالحی"}>
          <Mark />
          <span className="text-[15px] font-semibold tracking-tight text-foreground">آرکا صالحی</span>
        </Link>

        <nav className="hidden items-center lg:flex" aria-label="اصلی">
          {MENUS.map((menu) => (
            <NavMenu key={menu.label} label={menu.label} items={menu.items} />
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-1">
          <SearchBox className="hidden w-40 md:block" />
          <ThemeToggle />
          <Link href="/cart" className="relative rounded-md p-2 text-muted transition-colors duration-200 hover:text-foreground" aria-label="سبد خرید">
            <CartIcon />
            {count > 0 ? (
              <span className="absolute -top-0.5 end-0 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-medium text-[var(--brand-fg)]">
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
                  <span className="rounded-md p-2 text-muted transition-colors duration-200 hover:text-foreground">
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
            <Link href="/login" className="hidden rounded-md px-2.5 py-1.5 text-[14px] text-muted transition-colors duration-200 hover:text-foreground sm:inline-flex">
              ورود
            </Link>
          )}
          <Button href={workspaceUrl()} className="ms-1 hidden h-8 px-3 text-[13px] sm:inline-flex">
            شروع
          </Button>
          <button
            type="button"
            className="rounded-md p-2 text-foreground lg:hidden"
            aria-label={open ? "بستن منو" : "منو"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 top-14 z-40 overflow-auto bg-[var(--bg)] lg:hidden">
          <nav className="mx-auto flex w-full max-w-[1440px] flex-col gap-1 px-4 py-4" aria-label="موبایل">
            {MENUS.map((menu) => {
              const expanded = section === menu.label;
              return (
                <div key={menu.label} className="border-b border-border">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-3 text-[15px] font-medium"
                    aria-expanded={expanded}
                    onClick={() => setSection(expanded ? null : menu.label)}
                  >
                    {menu.label}
                    <Chevron open={expanded} />
                  </button>
                  {expanded ? (
                    <div className="pb-3">
                      {menu.items.map((item) => (
                        <MenuLink key={`${item.href}-${item.title}`} item={item} onClick={() => setOpen(false)} />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
            <div className="mt-4 flex flex-col gap-2">
              <SearchBox className="w-full" />
              {!user ? (
                <Button href="/login" variant="ghost" className="w-full" >
                  ورود
                </Button>
              ) : null}
              <Button href={workspaceUrl()} className="w-full">
                شروع
              </Button>
            </div>
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
    { href: workspaceUrl(), label: "ورک‌اسپیس" },
  ];
  const content = [...navItems.filter((item) => item.href !== "/")];
  const legal = cms.footer.links.filter((item) => !navItems.some((n) => n.href === item.href));

  return (
    <footer className="mt-16 border-t border-border bg-[var(--footer)] text-foreground">
      <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 py-14 md:grid-cols-12 md:px-8">
        <div className="md:col-span-4">
          <Link href="/" className="flex items-center gap-2">
            <Mark />
            <span className="text-[15px] font-semibold tracking-tight">آرکا صالحی</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted">{cms.about.bio}</p>
          <form
            className="mt-6 flex max-w-sm items-center gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="ایمیل برای خبرنامه"
              className="field"
              aria-label="ایمیل خبرنامه"
            />
            <button type="submit" className="sb-btn sb-btn-primary h-10 shrink-0 px-4">
              عضویت
            </button>
          </form>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 md:col-span-8">
          <FooterCol title="پلتفرم" items={platform} />
          <FooterCol title="محتوا" items={content} />
          <FooterCol title="قانونی" items={legal.length ? legal : [{ href: "mailto:hello@arkasalehi.ir", label: "تماس" }]} />
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8">
          <p className="text-xs text-muted">© {new Date().getFullYear()} آرکا صالحی</p>
          <div className="flex items-center gap-4 text-muted">
            {cms.socials.map((s) => (
              <a key={`${s.href}-${s.label}`} href={s.href} className="text-xs transition-colors duration-200 hover:text-foreground" rel="noreferrer">
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
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => {
          const cls = "text-sm text-foreground/90 transition-colors duration-200 hover:text-[var(--brand)]";
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
