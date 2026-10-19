import { siteConfig } from "@/lib/config";
import { DEFAULT_HERO_WEATHER, type HeroWeatherId } from "@/lib/cms/heroWeather";

export type CmsLink = { label: string; href: string };

export type PricingPackage = {
  id: string;
  name: string;
  description: string;
  /** Toman. Null shows priceLabel instead (for example «توافقی»). */
  priceAmount: number | null;
  priceLabel: string;
  highlighted: boolean;
  href: string;
};

export type PricingCms = {
  title: string;
  description: string;
  packages: PricingPackage[];
};

export type SiteCms = {
  hero: {
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaPrimaryHref: string;
    ctaSecondary: string;
    ctaSecondaryHref: string;
    weather: HeroWeatherId;
  };
  about: { title: string; bio: string; avatarUrl: string };
  footer: { links: CmsLink[] };
  seo: { title: string; description: string; ogImage: string };
  socials: CmsLink[];
  startHere: { title: string; description: string; slugs: string[] };
  pricing: PricingCms;
};

export const defaultCms = (): SiteCms => ({
  hero: {
    title: siteConfig.name,
    subtitle: siteConfig.headline,
    ctaPrimary: "سفارش پروژه",
    ctaPrimaryHref: "/#contact",
    ctaSecondary: "دیدن کارها",
    ctaSecondaryHref: "/#work",
    weather: DEFAULT_HERO_WEATHER,
  },
  about: { title: siteConfig.creator, bio: siteConfig.bio, avatarUrl: "" },
  footer: {
    links: [
      { label: "وبلاگ", href: "/blog" },
      { label: "ویدیو", href: "/video" },
      { label: "تماس", href: "/#contact" },
    ],
  },
  seo: { title: siteConfig.name, description: siteConfig.description, ogImage: "" },
  socials: [...siteConfig.socials],
  startHere: {
    title: "از اینجا شروع کنید",
    description: "مسیر کوتاه برای آشنایی با استودیو.",
    slugs: [],
  },
  pricing: {
    title: "قیمت‌ها",
    description: "دو مورد از کاتالوگ اولیهٔ استودیو، به‌علاوهٔ سفارش پروژه. قیمت سوم در مخزن عددی ندارد.",
    packages: [
      {
        id: "design-notebook",
        name: "دفترچه طراحی",
        description: "دفترچه محدود برای ایده‌پردازی روزانه.",
        // Price from supabase/migrations/20260903120000_init.sql (design-notebook).
        priceAmount: 390000,
        priceLabel: "",
        highlighted: false,
        href: "/#contact",
      },
      {
        id: "mentorship",
        name: "جلسه منتورشیپ",
        description: "یک جلسه خصوصی برای معماری محصول محتوا.",
        // Price from the same seed (mentorship).
        priceAmount: 2400000,
        priceLabel: "",
        highlighted: true,
        href: "/#contact",
      },
      {
        id: "custom",
        name: "پروژه سفارشی",
        description: "طراحی و ساخت برای یک کار مشخص. جزئیات را در گفتگو می‌چینیم.",
        // TODO: no package price exists in the repo for custom project work.
        priceAmount: null,
        priceLabel: "توافقی",
        highlighted: false,
        href: "/#contact",
      },
    ],
  },
});
