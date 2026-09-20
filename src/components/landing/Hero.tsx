import Link from "next/link";
import { HeroNameplate } from "@/components/landing/HeroNameplate";
import { HeroDashboardPreview } from "@/components/landing/HeroDashboardPreview";
import { workspaceUrl } from "@/lib/runtime";
import type { SiteCms } from "@/lib/cms/types";

const NAV = [
  { href: "/", label: "خانه", active: true },
  { href: "#how-it-works", label: "چطور کار می‌کند" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/products", label: "قیمت‌گذاری" },
  { href: "#enterprise", label: "سازمانی" },
];

export function Hero({ cms: _cms }: { cms: SiteCms }) {
  return (
    <section dir="rtl" className="hero-saas-shell full-bleed relative -mt-8 min-h-svh overflow-hidden font-sans md:-mt-10">
      <div className="hero-saas-sky absolute inset-0" />
      <Clouds />
      <div className="hero-saas-bottom-fade pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-40 md:h-52" aria-hidden />

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

      <div dir="ltr" className="hero-saas relative z-10 px-3 pb-24 pt-2 md:px-8 md:pb-32">
        <HeroDashboardPreview />
      </div>
    </section>
  );
}

function Clouds() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="hero-cloud-layer absolute inset-0">
        <div className="absolute left-[-12%] top-[12%] h-52 w-[50%] rounded-full bg-white/35 blur-3xl" />
        <div className="absolute right-[-14%] top-[4%] h-56 w-[48%] rounded-full bg-white/30 blur-3xl" />
        <div className="absolute left-[8%] top-[22%] h-16 w-40 rounded-full bg-white/40 blur-xl" />
      </div>
      <div className="hero-cloud-layer-b absolute inset-0">
        <div className="absolute bottom-[30%] left-[6%] h-40 w-[42%] rounded-full bg-white/50 blur-[64px]" />
        <div className="absolute bottom-[24%] right-[4%] h-44 w-[40%] rounded-full bg-white/55 blur-[70px]" />
        <div className="absolute left-[28%] top-[42%] h-28 w-72 rounded-full bg-white/25 blur-2xl" />
        <div className="absolute right-[12%] top-[26%] h-14 w-48 rounded-full bg-white/35 blur-xl" />
      </div>
    </div>
  );
}

