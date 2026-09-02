import { publicSiteUrl } from "@/lib/runtime";

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "آرکا صالحی",
  nameEn: "Arka Salehi",
  headline: "ایده را ساده بساز، واضح بگو",
  description:
    "پلتفرم محتوای آرکا صالحی؛ مقالات، ویدیو و شورتس. فقط خالق محتوا منتشر می‌کند — شما می‌توانید لایک، ذخیره و نظر بگذارید.",
  bio: "طراح و سازنده. اینجا شبکه اجتماعی نیست؛ یک استودیوی شخصی برای انتشار کارهایی است که ارزش ماندن دارند.",
  url: publicSiteUrl(),
  locale: "fa_IR",
  localeHtml: "fa",
  creator: "آرکا صالحی",
  twitter: "@arkasalehi",
  socials: [
    { href: "https://x.com/arkasalehi", label: "ایکس" },
    { href: "https://youtube.com", label: "یوتیوب" },
    { href: "mailto:hello@arkasalehi.ir", label: "ایمیل" },
  ],
} as const;

export const navItems = [
  { href: "/", label: "خانه" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/video", label: "ویدیو" },
  { href: "/shorts", label: "شورتس" },
  { href: "/products", label: "فروشگاه" },
] as const;
