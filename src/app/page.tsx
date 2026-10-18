import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { Skills } from "@/components/landing/Skills";
import { PricingSummary } from "@/components/landing/PricingSummary";
import { WorkGrid } from "@/components/landing/WorkGrid";
import { ContactBand } from "@/components/landing/ContactBand";
import { JsonLd } from "@/components/content/JsonLd";
import type { PostCardPost } from "@/components/content/PostCard";
import { buildMetadata, personJsonLd, professionalServiceJsonLd } from "@/lib/seo";
import { getSiteCms } from "@/lib/data/settings";
import { listPublishedPosts } from "@/lib/data/posts";
import { routeTimer } from "@/lib/timing";

export const revalidate = 60;

const DEMO_BLOGS: PostCardPost[] = [
  {
    id: "demo-blog-1",
    type: "BLOG",
    title: "چرا مینیمالیسم در محصول جواب می‌دهد",
    slug: "minimal-product-design",
    excerpt: "کمتر، واضح‌تر، سریع‌تر. این یادداشت درباره تصمیم‌های طراحی است که بار شناختی را کم می‌کنند.",
    coverImage: "/samples/blog-1.jpg",
    viewCount: 0,
    publishedAt: new Date(),
    category: { name: "طراحی" },
  },
  {
    id: "demo-blog-2",
    type: "BLOG",
    title: "معماری portable: از کلودفلر تا سرور خودتان",
    slug: "portable-architecture",
    excerpt: "لایه دیتابیس و احراز هویت را از APIهای اختصاصی ابر جدا کنید تا بعداً روی Node.js هم اجرا شود.",
    coverImage: "/samples/blog-2.jpg",
    viewCount: 0,
    publishedAt: new Date(),
    category: { name: "استودیو" },
  },
];

const DEMO_VIDEOS: PostCardPost[] = [
  {
    id: "demo-video-1",
    type: "VIDEO",
    title: "پشت‌صحنه یک جلسه استودیو",
    slug: "studio-session",
    excerpt: "نور، صدا و ریتم تدوین برای ویدیوی فارسی.",
    coverImage: "/samples/video-1.jpg",
    viewCount: 0,
    publishedAt: new Date(),
    category: { name: "استودیو" },
  },
  {
    id: "demo-video-2",
    type: "VIDEO",
    title: "یک پاس کوتاه روی UI شیشه‌ای",
    slug: "glass-ui-pass",
    excerpt: "گرادیان آبی و فیروزه‌ای بدون شلوغی.",
    coverImage: "/samples/video-2.jpg",
    viewCount: 0,
    publishedAt: new Date(),
    category: { name: "طراحی" },
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getSiteCms();
  return buildMetadata({
    title: cms.seo.title,
    description: cms.seo.description,
    image: cms.seo.ogImage || undefined,
    path: "/",
  });
}

export default async function HomePage() {
  const done = routeTimer("page /");
  const cms = await getSiteCms();
  const [blogs, videos] = await Promise.all([
    listPublishedPosts({ type: "BLOG", take: 3 }),
    listPublishedPosts({ type: "VIDEO", take: 3 }),
  ]);
  done();

  return (
    <div className="home-saas">
      <JsonLd data={personJsonLd()} />
      <JsonLd data={professionalServiceJsonLd()} />
      <Hero cms={cms} />
      <Skills />
      <PricingSummary pricing={cms.pricing} />
      <WorkGrid blogs={blogs.length ? blogs : DEMO_BLOGS} videos={videos.length ? videos : DEMO_VIDEOS} />
      <ContactBand />
    </div>
  );
}
