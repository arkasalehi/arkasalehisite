import { siteConfig } from "@/lib/config";

export type CmsLink = { label: string; href: string };

export type SiteCms = {
  hero: {
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaPrimaryHref: string;
    ctaSecondary: string;
    ctaSecondaryHref: string;
  };
  about: { title: string; bio: string; avatarUrl: string };
  footer: { links: CmsLink[] };
  seo: { title: string; description: string; ogImage: string };
  socials: CmsLink[];
  startHere: { title: string; description: string; slugs: string[] };
};

export const defaultCms = (): SiteCms => ({
  hero: {
    title: siteConfig.name,
    subtitle: siteConfig.headline,
    ctaPrimary: "مشاهده محتوا",
    ctaPrimaryHref: "/blog",
    ctaSecondary: "آخرین ویدیوها",
    ctaSecondaryHref: "/video",
  },
  about: { title: siteConfig.creator, bio: siteConfig.bio, avatarUrl: "" },
  footer: {
    links: [
      { label: "وبلاگ", href: "/blog" },
      { label: "ویدیو", href: "/video" },
      { label: "فروشگاه", href: "/products" },
    ],
  },
  seo: { title: siteConfig.name, description: siteConfig.description, ogImage: "" },
  socials: [...siteConfig.socials],
  startHere: {
    title: "از اینجا شروع کنید",
    description: "مسیر کوتاه برای آشنایی با استودیو.",
    slugs: [],
  },
});
