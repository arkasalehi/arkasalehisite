import Link from "next/link";
import { HeroNameplate } from "@/components/landing/HeroNameplate";
import { HeroDashboardPreview } from "@/components/landing/HeroDashboardPreview";
import { HeroAtmosphere } from "@/components/landing/HeroAtmosphere";
import { workspaceUrl } from "@/lib/runtime";
import { resolveHeroWeather } from "@/lib/cms/heroWeather";
import type { SiteCms } from "@/lib/cms/types";

const NAV = [
  { href: "/", label: "خانه", active: true },
  { href: "#how-it-works", label: "چطور کار می‌کند" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/products", label: "قیمت‌گذاری" },
  { href: "#enterprise", label: "سازمانی" },
];

export function Hero({ cms }: { cms: SiteCms }) {
  const weather = resolveHeroWeather(cms.hero.weather);

  return (
    <section dir="rtl" data-weather={weather} className="hero-saas-shell full-bleed relative overflow-hidden font-sans">
      <div className="hero-saas-sky absolute inset-0" />
      <HeroAtmosphere weather={weather} />
      <div className="hero-saas-bottom-fade pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 md:h-20" aria-hidden />

      <div className="relative z-10 px-5 pt-5 sm:px-8 md:px-12 md:pt-7">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="grid h-8 w-8 place-items-center rounded-[9px] border border-white/80 text-[15px] font-semibold">
              ×
            </span>
            <span className="text-[16px] font-semibold tracking-tight">آرکا صالحی</span>
          </Link>

          <nav className="hidden items-center gap-7 text-[14px] text-white/90 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={item.active ? "font-medium text-white underline decoration-white/80 underline-offset-[10px]" : "hover:text-white"}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <a
            href={workspaceUrl()}
            className="inline-flex h-10 items-center rounded-full bg-white px-5 text-[13px] font-semibold text-[#1c2430] shadow-[0_8px_20px_rgba(15,40,70,0.12)]"
          >
            ورود به ورک‌اسپیس
          </a>
        </header>

        <div className="mx-auto max-w-[920px] pb-6 pt-14 text-center md:pt-[68px]">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/20 px-4 py-1.5 text-[12px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-md">
            <span aria-hidden>✦</span>
            به آرکا صالحی خوش آمدید!
            <span aria-hidden>✦</span>
          </p>

          <HeroNameplate />

          <p className="mx-auto mt-5 max-w-[540px] text-[14px] leading-8 text-white/85 md:text-[16px]">
            برنامه‌ریزی کنید، اولویت بدهید و هر پروژه را از شروع تا پایان به‌سادگی دنبال کنید.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={workspaceUrl()}
              className="inline-flex h-11 items-center rounded-full bg-[#2f7de9] px-5 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(47,125,233,0.35)]"
            >
              باز کردن ورک‌اسپیس
            </a>
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-[#1c2430] shadow-[0_8px_22px_rgba(20,50,80,0.12)]"
            >
              ورود
            </Link>
          </div>
        </div>
      </div>

      <div dir="ltr" className="hero-saas relative z-10 px-3 pb-3 pt-2 md:px-8 md:pb-4">
        <HeroDashboardPreview />
      </div>
    </section>
  );
}
