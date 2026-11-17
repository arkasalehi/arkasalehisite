import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { Header } from "@/components/layout/Shell";
import { ArrowUp, BadgeIcon } from "@/components/landing/marks";
import { StudioSearch } from "@/components/landing/StudioSearch";
import type { SiteCms } from "@/lib/cms/types";

function localHref(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  if (value.startsWith("#") || value.startsWith("mailto:")) return value;
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) return value;
  return fallback;
}

function firstClause(text: string) {
  const sentence = text.split(/(?<=[.!؟])\s+/)[0]?.trim() || text.trim();
  return sentence.length > 140 ? `${sentence.slice(0, 140).trim()}…` : sentence;
}

function kickerFrom(bio: string) {
  const first = bio.split(/(?<=[.!؟])\s+/)[0]?.trim().replace(/[.!؟]$/, "") ?? "";
  return first.length > 0 && first.length <= 32 ? first : "";
}

function headlineLines(text: string): [string, string] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const parts = cleaned
    .split(/[،,]/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts.slice(1).join(" ")];
  const words = cleaned.split(" ").filter(Boolean);
  if (words.length < 2) return [cleaned, ""];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

function HeadlineLine({ text, tone }: { text: string; tone: "blue" | "violet" }) {
  if (!text) return null;
  const words = text.split(" ").filter(Boolean);
  const mid = Math.max(1, Math.ceil(words.length / 2));
  const before = words.slice(0, mid).join(" ");
  const after = words.slice(mid).join(" ");
  return (
    <span className="ph-hero-line">
      {before} <BadgeIcon tone={tone} /> {after}
    </span>
  );
}

export function Hero({ cms }: { cms: SiteCms }) {
  const primaryHref = localHref(cms.hero.ctaPrimaryHref, "/#contact");
  const secondaryHref = localHref(cms.hero.ctaSecondaryHref, "/#work");
  const headline = (cms.hero.subtitle || cms.hero.title || "آرکا صالحی").trim();
  const [first, second] = headlineLines(headline);
  const kicker = kickerFrom(cms.about.bio || "");
  const supportSource = (cms.seo.description || "").trim();
  const support = supportSource && supportSource !== headline ? firstClause(supportSource) : "";

  return (
    <div className="site-container ph-hero-wrap">
      <section className="ph-hero" aria-label="معرفی">
        <Header cms={cms} embedded />
        <div className="ph-hero-copy">
          {kicker ? <p className="ph-kicker">{kicker}</p> : null}
          <h1 className="ph-hero-title">
            <HeadlineLine text={first} tone="blue" />
            <HeadlineLine text={second} tone="violet" />
          </h1>
          {support ? <p className="ph-hero-sub">{support}</p> : null}
          <div className="ph-hero-actions">
            <Link href={primaryHref} className="ph-join">
              {cms.hero.ctaPrimary || "سفارش پروژه"}
              <span className="ph-join-disc">
                <ArrowUp />
              </span>
            </Link>
            <Link href={secondaryHref} className="ph-btn ph-btn-light">
              {cms.hero.ctaSecondary || "دیدن کارها"}
            </Link>
          </div>
        </div>
      </section>
      <StudioSearch />
    </div>
  );
}
