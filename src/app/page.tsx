import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { About } from "@/components/landing/About";
import { ShortsRail } from "@/components/landing/ShortsRail";
import { StartHere } from "@/components/landing/StartHere";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeaturedRail } from "@/components/landing/FeaturedRail";
import { PostCard } from "@/components/content/PostCard";
import { ProductCard } from "@/components/content/ProductCard";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { PageSection } from "@/components/layout/Page";
import { Reveal, Stagger } from "@/components/motion/Reveal";
import { buildMetadata } from "@/lib/seo";
import { getSiteCms } from "@/lib/data/settings";
import { getPostsBySlugs, listPublishedPosts } from "@/lib/data/posts";
import { listProducts } from "@/lib/data/products";

export const revalidate = 60;

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
  const videoRail = videos.length ? videos : featured.filter((p) => p.type === "VIDEO").slice(0, 4);
  const videoFallback = videoRail.length ? videoRail : latest.slice(0, 4);
  const products = featuredProducts.length ? featuredProducts : allProducts;
  const startPosts = startHere.length ? startHere : latest.slice(0, 6);

  return (
    <div>
      <Hero cms={cms} />

      <Reveal>
        <PageSection>
          <SectionHeader title="تازه‌های وبلاگ" href="/blog" description="یادداشت‌های تازه استودیو." />
          {blogCards.length ? (
            <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blogCards.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </Stagger>
          ) : (
            <EmptyState title="وبلاگ به‌زودی" description="وقتی مطلبی منتشر شود، اینجا روی قفسه می‌نشیند." href="/blog" action="وبلاگ" />
          )}
        </PageSection>
      </Reveal>

      <Reveal>
        <PageSection>
          <SectionHeader title="ویدیوهای برگزیده" href="/video" description="یک قاب بزرگ، سه برش کوتاه." />
          {videoFallback.length ? (
            <FeaturedRail posts={videoFallback} />
          ) : (
            <EmptyState title="ویدیویی نیست" href="/video" action="ویدیو" />
          )}
        </PageSection>
      </Reveal>

      <PageSection>
        <SectionHeader title="شورتس ترند" href="/shorts" description="کلیپ‌های عمودی استودیو." />
        {shorts.length ? (
          <ShortsRail posts={shorts} />
        ) : (
          <EmptyState title="شورتسی نیست" href="/shorts" action="شورتس" />
        )}
      </PageSection>

      {startPosts.length ? (
        <Reveal>
          <PageSection>
            <SectionHeader
              title={cms.startHere.title || "شروع از اینجا"}
              href="/blog"
              description={cms.startHere.description}
            />
            <StartHere posts={startPosts} />
          </PageSection>
        </Reveal>
      ) : null}

      <PageSection>
        <SectionHeader title="ابزارها" href="/products" description="محصولات محدود و کاربردی استودیو." />
        {products.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} variant="tool" />
            ))}
          </div>
        ) : (
          <EmptyState title="ابزاری نیست" href="/products" action="فروشگاه" />
        )}
      </PageSection>

      <PageSection>
        <About cms={cms} />
      </PageSection>
    </div>
  );
}
