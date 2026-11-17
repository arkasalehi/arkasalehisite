"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { navItems, siteConfig } from "@/lib/config";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { canAccessWorkspace, isAdminRole } from "@/lib/auth/roles";
import { workspaceUrl } from "@/lib/runtime";
import { useAuth } from "@/components/providers";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { SearchBox } from "@/components/layout/SearchBox";
import { Dropdown } from "@/components/ui/Dropdown";
import type { SiteCms } from "@/lib/cms/types";

type NavLink = { href: string; label: string; external?: boolean };

const PILL: NavLink[] = [
  { href: "/", label: "خانه" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/video", label: "ویدیو" },
  { href: "/#pricing", label: "قیمت‌ها" },
  { href: "/#contact", label: "تماس" },
];

const MORE: NavLink[] = [
  { href: "/#skills", label: "مهارت‌ها" },
  { href: "/#work", label: "کارها" },
  { href: "/dashboard", label: "داشبورد" },
  { href: workspaceUrl(), label: "ورک‌اسپیس", external: true },
];

function safeCta(value: string | undefined) {
  if (!value) return "/#contact";
  if (value.startsWith("#")) return `/${value}`;
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) return value;
  return "/#contact";
}

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavAnchor({ item, onClick, className }: { item: NavLink; onClick?: () => void; className?: string }) {
  if (item.external || item.href.startsWith("http") || item.href.startsWith("mailto:")) {
    return (
      <a href={item.href} className={className} onClick={onClick} rel="noreferrer">
        {item.label}
      </a>
    );
  }
  return (
    <Link href={item.href} className={className} onClick={onClick}>
      {item.label}
    </Link>
  );
}

function Mark() {
  return (
    <span className="ph-brand-mark" aria-hidden>
      آ
    </span>
  );
}

export function Header({ cms, embedded = false }: { cms: SiteCms; embedded?: boolean }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const cta = cms.hero.ctaPrimary || "سفارش پروژه";
  const ctaHref = safeCta(cms.hero.ctaPrimaryHref);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className={embedded ? "ph-header ph-header-embed" : "ph-header"}>
      <div className={embedded ? "ph-header-bar" : "site-container ph-header-bar"}>
        <Link href="/" className="ph-brand" aria-label={cms.seo.title || siteConfig.name}>
          <Mark />
          <span className="ph-brand-name">{siteConfig.name}</span>
        </Link>

        <nav className="ph-pillnav" aria-label="اصلی">
          {PILL.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isCurrent(pathname, item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ph-actions">
          {embedded ? null : (
            <div className="ph-header-search">
              <SearchBox pill className="w-40" />
            </div>
          )}
          {user ? <NotificationBell /> : null}
          <Link href={ctaHref || "/#contact"} className="ph-btn ph-btn-black ph-desktop-only">
            {cta}
          </Link>
          {user ? (
            <div className="ph-account ph-desktop-only">
              <Dropdown
                align="end"
                trigger={<span className="ph-btn ph-btn-light">حساب</span>}
              >
                <Link href="/dashboard" className="block rounded-xl px-3 py-2 text-sm hover:bg-foreground/5">
                  داشبورد
                </Link>
                {canAccessWorkspace(user.role) ? (
                  <a href={workspaceUrl()} className="block rounded-xl px-3 py-2 text-sm hover:bg-foreground/5">
                    ورک‌اسپیس
                  </a>
                ) : null}
                {isAdminRole(user.role) ? (
                  <Link href="/admin" className="block rounded-xl px-3 py-2 text-sm hover:bg-foreground/5">
                    پنل ادمین
                  </Link>
                ) : null}
                <Link href="/dashboard/saved" className="block rounded-xl px-3 py-2 text-sm hover:bg-foreground/5">
                  ذخیره‌ها
                </Link>
              </Dropdown>
            </div>
          ) : (
            <Link href="/login" className="ph-btn ph-btn-light ph-desktop-only">
              ورود
            </Link>
          )}
          <button
            type="button"
            className="ph-menu-btn"
            aria-label={open ? "بستن منو" : "منو"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="ph-drawer" role="presentation" onClick={() => setOpen(false)}>
          <nav className="ph-drawer-panel" aria-label="موبایل" onClick={(e) => e.stopPropagation()}>
            <SearchBox pill className="w-full" />
            {PILL.map((item) => (
              <NavAnchor key={item.href} item={item} onClick={() => setOpen(false)} />
            ))}
            <p className="ph-drawer-label">بیشتر</p>
            {MORE.map((item) => (
              <NavAnchor key={item.href} item={item} onClick={() => setOpen(false)} />
            ))}
            {user ? (
              <Link href="/dashboard/notifications" onClick={() => setOpen(false)}>
                اعلان‌ها
              </Link>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)}>
                ورود
              </Link>
            )}
            {user && isAdminRole(user.role) ? (
              <Link href="/admin" onClick={() => setOpen(false)}>
                پنل ادمین
              </Link>
            ) : null}
            <Link href={ctaHref || "/#contact"} className="ph-btn ph-btn-black mt-2" onClick={() => setOpen(false)}>
              {cta}
            </Link>
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
    <footer className="ph-footer">
      <div className="site-container ph-footer-grid">
        <div>
          <Link href="/" className="ph-brand">
            <Mark />
            <span>{siteConfig.name}</span>
          </Link>
          <p className="ph-footer-bio">{cms.about.bio}</p>
          <form className="ph-footer-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" required placeholder="ایمیل برای خبرنامه" className="field" aria-label="ایمیل خبرنامه" />
            <button type="submit" className="ph-btn ph-btn-black">
              عضویت
            </button>
          </form>
        </div>
        <div className="ph-footer-cols">
          <FooterCol title="پلتفرم" items={platform} />
          <FooterCol title="محتوا" items={content} />
          <FooterCol title="قانونی" items={legal.length ? legal : [{ href: "mailto:hello@arkasalehi.ir", label: "تماس" }]} />
        </div>
      </div>
      <div className="site-container ph-footer-bar">
        <p>© {new Date().getFullYear()} {siteConfig.name}</p>
        <div className="ph-footer-socials">
          {cms.socials.map((item) => (
            <a key={`${item.href}-${item.label}`} href={item.href} rel="noreferrer">
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: Array<{ href: string; label: string }> }) {
  return (
    <div>
      <p>{title}</p>
      <ul>
        {items.map((item) => (
          <li key={`${item.href}-${item.label}`}>
            {item.href.startsWith("http") || item.href.startsWith("mailto:") ? (
              <a href={item.href} rel="noreferrer">
                {item.label}
              </a>
            ) : (
              <Link href={item.href}>{item.label}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
