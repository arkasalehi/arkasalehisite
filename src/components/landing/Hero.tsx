import Image from "next/image";
import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { HeroNameplate } from "@/components/landing/HeroNameplate";
import { samples } from "@/lib/media";
import type { SiteCms } from "@/lib/cms/types";

function localHref(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  if (value.startsWith("#") || value.startsWith("mailto:")) return value;
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) return value;
  return fallback;
}

export function Hero({ cms }: { cms: SiteCms }) {
  const primaryHref = localHref(cms.hero.ctaPrimaryHref, "/#contact");
  const secondaryHref = localHref(cms.hero.ctaSecondaryHref, "/#work");
  return (
    <section className="hero-saas-shell relative overflow-hidden">
      <div className="hero-saas-sky absolute inset-0" />
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="site-container relative pb-16 pt-14 text-center md:pb-24 md:pt-20">
        <p className="sb-fade-up mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium text-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" aria-hidden />
          طراح و سازنده
        </p>
        <div className="sb-fade-up">
          <HeroNameplate />
        </div>
        <p className="sb-fade-up mx-auto mt-5 max-w-[34rem] text-[15px] leading-8 text-muted md:text-[17px]">
          {cms.hero.subtitle || cms.about.bio}
        </p>
        <div className="sb-fade-up mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link href={primaryHref} className="sb-btn sb-btn-primary h-10 px-4 text-[14px]">
            {cms.hero.ctaPrimary || "سفارش پروژه"}
          </Link>
          <Link href={secondaryHref} className="sb-btn sb-btn-secondary h-10 px-4 text-[14px]">
            {cms.hero.ctaSecondary || "دیدن کارها"}
          </Link>
        </div>
        <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-xl border border-border bg-card">
          <div className="relative aspect-[16/9]">
            <Image
              src={samples.hero}
              alt="میز کار استودیو آرکا صالحی"
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover object-center"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
