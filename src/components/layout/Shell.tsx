"use client";

import { useEffect, useState } from "react";
import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { navItems } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/Dropdown";
import { CloseIcon, MenuIcon, UserIcon } from "@/components/icons";
import { canAccessWorkspace, isAdminRole } from "@/lib/auth/roles";
import { workspaceUrl } from "@/lib/runtime";
import { useAuth } from "@/components/providers";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { SearchBox } from "@/components/layout/SearchBox";
import { Button } from "@/components/ui/Button";
import type { SiteCms } from "@/lib/cms/types";
import { isRetiredPublicHref } from "@/lib/public-links";

type NavLink = { href: string; title: string; body: string; external?: boolean };

const MENUS: Array<{ label: string; items: NavLink[] }> = [
  {
    label: "محصول",
    items: [
      { href: "/blog", title: "وبلاگ", body: "یادداشت‌های استودیو، با همان زبان کار روزمره." },
      { href: "/video", title: "ویدیو", body: "قاب‌های بلند و برش‌های برگزیده." },
      { href: "/#work", title: "کارها", body: "آخرین نوشته‌ها و ویدیوها در صفحهٔ اول." },
    ],
  },
  {
    label: "ورک‌اسپیس",
    items: [
      { href: workspaceUrl(), title: "استودیو", body: "تسک، چت، سند و جلسه در یک فضا.", external: true },
      { href: "/#skills", title: "مهارت‌ها", body: "طراحی، وب و جلسهٔ معماری محصول." },
      { href: "/login", title: "ورود همکاران", body: "حساب همکار برای دسترسی به استودیو." },
    ],
  },
  {
    label: "منابع",
    items: [
      { href: "/#pricing", title: "قیمت‌ها", body: "بسته‌ها و سفارش پروژه." },
      { href: "/#contact", title: "تماس", body: "پیام برای سفارش کار." },
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
    <header className="site-nav sticky top-0 z-40 border-b border-border bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className="site-container flex h-14 items-center gap-2">
        <Link href="/" className="flex min-w-0 items-center gap-2" aria-label={cms.seo.title || "آرکا صالحی"}>
          <Mark />
          <span className="hidden truncate text-[15px] font-semibold tracking-tight text-foreground sm:inline">آرکا صالحی</span>
        </Link>

        <nav className="hidden items-center lg:flex" aria-label="اصلی">
          {MENUS.map((menu) => (
            <NavMenu key={menu.label} label={menu.label} items={menu.items} />
          ))}
        </nav>

        <div className="ms-auto flex min-w-0 items-center justify-end gap-1">
          <SearchBox className="hidden w-40 min-w-0 lg:block" />
          <div className="hidden items-center lg:flex">
            <ThemeToggle />
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
              <Link href="/login" className="shrink-0 rounded-md px-2.5 py-1.5 text-[14px] text-muted transition-colors duration-200 hover:text-foreground">
                ورود
              </Link>
            )}
          </div>
          <Button href="/#contact" className="ms-1 h-8 shrink-0 px-3 text-[13px]">
            شروع
          </Button>
        </div>
        <button
          type="button"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-foreground lg:hidden"
          aria-label={open ? "بستن منو" : "منو"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
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
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-1">
                <span className="text-sm text-muted">پوسته</span>
                <ThemeToggle />
              </div>
              {user ? (
                <>
                  <Link href="/dashboard" className="rounded-md px-3 py-2 text-sm hover:bg-foreground/5" onClick={() => setOpen(false)}>
                    داشبورد
                  </Link>
                  <Link href="/dashboard/notifications" className="rounded-md px-3 py-2 text-sm hover:bg-foreground/5" onClick={() => setOpen(false)}>
                    اعلان‌ها
                  </Link>
                  {isAdminRole(user.role) ? (
                    <Link href="/admin" className="rounded-md px-3 py-2 text-sm hover:bg-foreground/5" onClick={() => setOpen(false)}>
                      پنل ادمین
                    </Link>
                  ) : null}
                </>
              ) : (
                <Button href="/login" variant="ghost" className="w-full">
                  ورود
                </Button>
              )}
              <Button href="/#contact" className="w-full" onClick={() => setOpen(false)}>
                شروع گفتگو
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
  const legal = cms.footer.links.filter(
    (item) => !isRetiredPublicHref(item.href) && item.label !== "فروشگاه" && item.label !== "شورتس" && !navItems.some((n) => n.href === item.href),
  );

  return (
    <footer className="border-t border-border bg-[var(--footer)] text-foreground">
      <div className="site-container grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <Link href="/" className="flex items-center gap-2">
            <Mark />
            <span className="text-[15px] font-semibold tracking-tight">آرکا صالحی</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted">{cms.about.bio}</p>
          <form
            className="mt-6 flex max-w-sm flex-col gap-2 sm:flex-row sm:items-center"
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
        <div className="site-container flex flex-wrap items-center justify-between gap-4 py-5">
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
