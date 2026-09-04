import { Button } from "@/components/ui/Button";
import { CoverImage } from "@/components/content/CoverImage";
import { ArrowIcon } from "@/components/icons";
import { samples } from "@/lib/media";
import type { SiteCms } from "@/lib/cms/types";

const STATS = [
  { value: "۵۰هزار+", label: "خالق" },
  { value: "۲ میلیون+", label: "مخاطب" },
  { value: "۵۰۰+", label: "رویداد" },
  { value: "۲۴/۷", label: "پخش" },
];

export function Hero({ cms }: { cms: SiteCms }) {
  const { hero } = cms;
  const title = hero.title.trim().length >= 24 ? hero.title : "جایی که محتوا به صنعت تبدیل می‌شود.";

  return (
    <section className="flex flex-col pb-4 pt-6 md:pt-10">
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--glass)] px-3 py-1 text-xs text-muted backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--status)]" />
        در دسترس برای پروژه جدید
      </span>

      <h1 className="mt-6 max-w-5xl text-right text-[40px] font-extrabold leading-[1.12] tracking-[-0.05em] md:text-[72px] lg:text-[80px]">
        {title}
      </h1>

      <div className="order-3 mt-6 flex flex-col gap-5 md:order-2 md:mt-8 md:flex-row md:items-end md:justify-between">
        <p className="max-w-xl text-base leading-8 text-muted md:text-lg">{hero.subtitle}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button href={hero.ctaPrimaryHref} className="px-6 py-3">
            {hero.ctaPrimary}
          </Button>
          <Button href={hero.ctaSecondaryHref} variant="ghost" className="px-5 py-3">
            {hero.ctaSecondary}
            <ArrowIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <figure className="editorial-media order-2 mt-8 aspect-[16/10] w-full overflow-hidden rounded-[20px] md:order-3 md:mt-10 md:aspect-[16/7] md:rounded-[24px] md:h-[520px] md:aspect-auto">
        <CoverImage src={samples.hero} alt="استودیو آرکا صالحی" seed="hero" kind="hero" sizes="1280px" priority />
        <figcaption className="absolute bottom-4 right-4 z-10 text-[11px] font-medium tracking-wide text-white/80">
          استودیو / ۱۴۰۵
        </figcaption>
      </figure>

      <dl className="order-4 mt-10 grid grid-cols-2 gap-8 border-t border-[var(--border)] pt-8 md:grid-cols-4 md:gap-6">
        {STATS.map((item) => (
          <div key={item.label}>
            <dt className="text-3xl font-extrabold tracking-tight md:text-5xl">{item.value}</dt>
            <dd className="mt-1 text-sm text-muted">{item.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
