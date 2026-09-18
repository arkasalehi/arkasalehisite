import Link from "next/link";
import { HeroNameplate } from "@/components/landing/HeroNameplate";
import { HeroDashboardPreview } from "@/components/landing/HeroDashboardPreview";
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

          <Link
            href="/register"
            className="inline-flex h-10 items-center rounded-full bg-white px-5 text-[13px] font-semibold text-[#1c2430] shadow-[0_8px_20px_rgba(15,40,70,0.12)]"
          >
            رایگان شروع کنید
          </Link>
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
              href="#download"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#2f7de9] px-5 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(47,125,233,0.35)]"
            >
              <AppleMark />
              دانلود برای مک
            </a>
            <a
              href="#demo"
              className="inline-flex h-11 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-[#1c2430] shadow-[0_8px_22px_rgba(20,50,80,0.12)]"
            >
              رزرو دمو
            </a>
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

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M16.37 12.64c.03-2.54 2.07-3.76 2.16-3.82-1.18-1.72-3.01-1.96-3.66-1.98-1.56-.16-3.04.91-3.82.91-.79 0-2.01-.89-3.3-.87-1.7.03-3.26.99-4.13 2.51-1.76 3.06-.45 7.61 1.26 10.1.84 1.21 1.83 2.58 3.14 2.53 1.27-.05 1.75-.82 3.28-.82 1.52 0 1.95.82 3.29.79 1.36-.02 2.22-1.23 3.05-2.47.96-1.4 1.35-2.76 1.38-2.83-.03-.01-2.65-1.02-2.65-4.05zM13.95 6.19c.69-.84 1.16-2.01 1.03-3.18-1 .04-2.21.67-2.93 1.5-.65.74-1.21 1.93-1.06 3.07 1.12.09 2.26-.57 2.96-1.39z" />
    </svg>
  );
}
