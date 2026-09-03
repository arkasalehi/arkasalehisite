import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { About } from "@/components/landing/About";
import { ShortsRail } from "@/components/landing/ShortsRail";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeaturedRail } from "@/components/landing/FeaturedRail";
import { PostCard } from "@/components/content/PostCard";
import { ProductCard } from "@/components/content/ProductCard";
import { SectionHeader } from "@/components/layout/SectionHeader";
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
  const [featured, latest, shorts, products, startHere] = await Promise.all([
    listPublishedPosts({ featured: true, take: 8 }),
    listPublishedPosts({ take: 9 }),
    listPublishedPosts({ type: "SHORT", take: 8 }),
    listProducts({ featured: true, take: 3 }),
    getPostsBySlugs(cms.startHere.slugs),
  ]);

  const highlight = featured.length ? featured : latest.slice(0, 6);

  return (
    <div className="space-y-24">
      <Hero cms={cms} />

      {startHere.length ? (
        <Reveal>
          <section>
            <SectionHeader title={cms.startHere.title} description={cms.startHere.description} />
            <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {startHere.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </Stagger>
          </section>
        </Reveal>
      ) : null}

      <Reveal>
        <section>
          <SectionHeader title="برگزیده‌ها" href="/blog" description="محتوای شاخص؛ مقاله و ویدیو در یک ریل." />
          {highlight.length ? <FeaturedRail posts={highlight} /> : <EmptyState title="هنوز برگزیده‌ای نیست" href="/blog" action="وبلاگ" />}
        </section>
      </Reveal>

      <section>
        <SectionHeader title="جدیدترین‌ها" href="/blog" description="مقاله، ویدیو و شورتس در یک جریان." />
        {latest.length ? (
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </Stagger>
        ) : (
          <EmptyState title="هنوز مطلبی منتشر نشده" description="وقتی محتوا منتشر شود، اینجا دیده می‌شود." href="/blog" action="وبلاگ" />
        )}
      </section>

      <section>
        <SectionHeader title="شورتس" href="/shorts" description="کارت‌های عمودی با اسکرول اسنپ." />
        {shorts.length ? <ShortsRail posts={shorts} /> : <EmptyState title="شورتسی نیست" href="/shorts" action="شورتس" />}
      </section>

      <section>
        <SectionHeader title="فروشگاه" href="/products" description="محصولات محدود و کاربردی." />
        {products.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState title="محصولی نیست" href="/products" action="فروشگاه" />
        )}
      </section>

      <About cms={cms} />
    </div>
  );
}
