import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { StudioPitch } from "@/components/landing/StudioPitch";
import { About } from "@/components/landing/About";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ShortsRail } from "@/components/landing/ShortsRail";
import { StartHere } from "@/components/landing/StartHere";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeaturedRail } from "@/components/landing/FeaturedRail";
import { PostCard, type PostCardPost } from "@/components/content/PostCard";
import { ProductCard } from "@/components/content/ProductCard";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { PageSection } from "@/components/layout/Page";
import { Reveal, Stagger } from "@/components/motion/Reveal";
import { buildMetadata } from "@/lib/seo";
import { getSiteCms } from "@/lib/data/settings";
import { getPostsBySlugs, listPublishedPosts } from "@/lib/data/posts";
import { listProducts } from "@/lib/data/products";

export const revalidate = 60;

const homeSection = "mt-8 scroll-mt-8 md:mt-10";

const DEMO_BLOG_CARDS: PostCardPost[] = [
  {
    id: "demo-blog-1",
    type: "BLOG",
    title: "کارت تست: انتشار آنی از استودیو",
    slug: "demo-card-studio",
    excerpt: "یک یادداشت نمونه برای دیدن ظاهر کارت وبلاگ؛ شیشه، تگ‌ها و قاب تصویر در چیدمان راست‌چین.",
    coverImage: "/samples/studio.jpg",
    viewCount: 128,
    publishedAt: new Date(),
    readingTime: 3,
    category: { name: "استودیو" },
  },
  {
    id: "demo-blog-2",
    type: "BLOG",
    title: "چطور ورک‌اسپیس را روزانه کنیم",
    slug: "demo-card-workspace",
    excerpt: "از چت تا جلسه و تسک، مسیر کار روزمره را در یک فضا نگه دارید تا چیزی گم نشود.",
    coverImage: "/samples/blog-1.jpg",
    viewCount: 86,
    publishedAt: new Date(),
    readingTime: 4,
    category: { name: "ورک‌اسپیس" },
  },
  {
    id: "demo-blog-3",
    type: "BLOG",
    title: "شورتس و قاب بزرگ",
    slug: "demo-card-shorts",
    excerpt: "یک قاب اصلی و چند برش کوتاه — بدون شلوغی اضافه، با همان زبان هیرو.",
    coverImage: "/samples/blog-2.jpg",
    viewCount: 54,
    publishedAt: new Date(),
    readingTime: 2,
    category: { name: "محتوا" },
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
  const cms = await getSiteCms();
  const [featured, latest, blogs, videos, shorts, featuredProducts, allProducts, startHere] = await Promise.all([
    listPublishedPosts({ featured: true, take: 8 }),
    listPublishedPosts({ take: 9 }),
    listPublishedPosts({ type: "BLOG", take: 3 }),
    listPublishedPosts({ type: "VIDEO", take: 4 }),
    listPublishedPosts({ type: "SHORT", take: 5 }),
    listProducts({ featured: true, take: 4 }),
    listProducts({ take: 4 }),
    getPostsBySlugs(cms.startHere.slugs),
  ]);

  const blogCards = blogs.length ? blogs : latest.filter((p) => p.type === "BLOG").slice(0, 3);
  const blogRail = blogCards.length ? blogCards : DEMO_BLOG_CARDS;
  const videoRail = videos.length ? videos : featured.filter((p) => p.type === "VIDEO").slice(0, 4);
  const videoFallback = videoRail.length ? videoRail : latest.slice(0, 4);
  const products = featuredProducts.length ? featuredProducts : allProducts;
  const startPosts = startHere.length ? startHere : latest.slice(0, 6);

  return (
    <div className="home-saas pb-6 md:pb-8">
      <Hero cms={cms} />
      <StudioPitch />

      <Reveal>
        <PageSection className="mt-5 scroll-mt-8 md:mt-6">
          <SectionHeader
            tone="saas"
            title="تازه‌های وبلاگ"
            href="/blog"
            description="یادداشت‌های تازه استودیو، با همان زبان سادهٔ کار روزمره."
          />
          {blogRail.length ? (
            <Stagger className="grid gap-5 lg:grid-cols-2">
              {blogRail.map((post) => (
                <PostCard key={post.id} post={post} href={post.id.startsWith("demo-") ? "/blog" : undefined} />
              ))}
            </Stagger>
          ) : (
            <EmptyState
              compact
              title="وبلاگ به‌زودی"
              description="وقتی مطلبی منتشر شود، اینجا می‌آید."
              href="/blog"
              action="وبلاگ"
            />
          )}
        </PageSection>
      </Reveal>

      <Reveal>
        <PageSection className={homeSection}>
          <SectionHeader
            tone="saas"
            title="ویدیوهای برگزیده"
            href="/video"
            description="یک قاب اصلی و چند برش کوتاه، بدون شلوغی اضافه."
          />
          {videoFallback.length ? (
            <FeaturedRail posts={videoFallback} />
          ) : (
            <EmptyState compact title="ویدیویی نیست" href="/video" action="ویدیو" />
          )}
        </PageSection>
      </Reveal>

      <PageSection className={homeSection}>
        <SectionHeader tone="saas" title="شورتس ترند" href="/shorts" description="کلیپ‌های عمودی استودیو، در یک ریل مرتب." />
        {shorts.length ? (
          <ShortsRail posts={shorts} />
        ) : (
          <EmptyState compact title="شورتسی نیست" href="/shorts" action="شورتس" />
        )}
      </PageSection>

      <Reveal>
        <PageSection id="how-it-works" className={homeSection}>
          <SectionHeader
            tone="saas"
            title="چطور کار می‌کند"
            href="/login"
            action="شروع"
            description="از ایده تا انتشار، سه قدم مشخص — همان مسیری که در ورک‌اسپیس می‌بینید."
          />
          <HowItWorks />
        </PageSection>
      </Reveal>

      {startPosts.length ? (
        <Reveal>
          <PageSection className={homeSection}>
            <SectionHeader
              tone="saas"
              title={cms.startHere.title || "شروع از اینجا"}
              href="/blog"
              description={cms.startHere.description || "چند نقطهٔ ورود کوتاه برای آشنایی با استودیو."}
            />
            <StartHere posts={startPosts} />
          </PageSection>
        </Reveal>
      ) : null}

      <PageSection id="enterprise" className={homeSection}>
        <SectionHeader
          tone="saas"
          title="ابزارها و سازمانی"
          href="/products"
          action="قیمت‌گذاری"
          description="محصولات محدود استودیو برای تیم‌هایی که می‌خواهند کار را یکجا نگه دارند."
        />
        {products.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} variant="tool" />
            ))}
          </div>
        ) : (
          <EmptyState compact title="ابزاری نیست" href="/products" action="فروشگاه" />
        )}
      </PageSection>

      <PageSection className={homeSection}>
        <About cms={cms} />
      </PageSection>
    </div>
  );
}
