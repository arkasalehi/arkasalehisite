import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { HeroNameplate } from "@/components/landing/HeroNameplate";
import { HeroDashboardPreview } from "@/components/landing/HeroDashboardPreview";
import { HeroAtmosphere } from "@/components/landing/HeroAtmosphere";
import { workspaceUrl } from "@/lib/runtime";
import { resolveHeroWeather } from "@/lib/cms/heroWeather";
import type { SiteCms } from "@/lib/cms/types";

export function Hero({ cms }: { cms: SiteCms }) {
  const weather = resolveHeroWeather(cms.hero.weather);

  return (
    <section dir="rtl" data-weather={weather} className="hero-saas-shell relative overflow-hidden font-sans">
      <div className="hero-saas-sky absolute inset-0" />
      <HeroAtmosphere weather={weather} />
      <div className="hero-grid pointer-events-none absolute inset-0 z-[1]" aria-hidden />
      <div className="hero-saas-bottom-fade pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-24" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-[1100px] px-5 pb-8 pt-16 text-center sm:px-8 md:pt-24">
        <p className="sb-fade-up mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-medium text-[#ededed]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3ecf8e]" aria-hidden />
          استودیوی شخصی آرکا صالحی
        </p>

        <div className="sb-fade-up">
          <HeroNameplate />
        </div>

        <p className="sb-fade-up mx-auto mt-5 max-w-[560px] text-[15px] leading-8 text-white/70 md:text-[17px]">
          برنامه‌ریزی کنید، اولویت بدهید و هر پروژه را از شروع تا پایان در یک فضای تیره و جمع‌وجور دنبال کنید.
        </p>

        <div className="sb-fade-up mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href={workspaceUrl()} className="sb-btn sb-btn-primary h-10 px-4 text-[14px]">
            باز کردن ورک‌اسپیس
          </a>
          <Link href="/login" className="sb-btn sb-btn-secondary h-10 border-white/15 px-4 text-[14px] text-white hover:bg-white/5">
            ورود
          </Link>
        </div>
      </div>

      <div dir="ltr" className="hero-saas relative z-10 px-3 pb-6 pt-2 md:px-8 md:pb-10">
        <HeroDashboardPreview />
      </div>
    </section>
  );
}
