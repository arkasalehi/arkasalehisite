import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { About } from "@/components/landing/About";
import { ShortsRail } from "@/components/landing/ShortsRail";
import { PostCard } from "@/components/content/PostCard";
import { ProductCard } from "@/components/content/ProductCard";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Reveal, Stagger } from "@/components/motion/Reveal";
import { buildMetadata } from "@/lib/seo";
import { getSiteCms } from "@/lib/db/settings";
import { getPostsBySlugs, listPublishedPosts } from "@/lib/db/posts";
import { listProducts } from "@/lib/db/products";

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
    listPublishedPosts({ featured: true, take: 6 }),
    listPublishedPosts({ take: 9 }),
    listPublishedPosts({ type: "SHORT", take: 8 }),
    listProducts({ featured: true, take: 3 }),
    getPostsBySlugs(cms.startHere.slugs),
  ]);

  const highlight = featured.length ? featured : latest.slice(0, 4);

  return (
    <div className="space-y-20">
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
          <SectionHeader title="برگزیده‌ها" href="/blog" description="کارهایی که الان باید دیده شوند." />
          <Stagger className="grid gap-5 md:grid-cols-2">
            {highlight.map((post, i) => (
              <PostCard key={post.id} post={post} featured={i === 0} />
            ))}
          </Stagger>
        </section>
      </Reveal>

      <section>
        <SectionHeader title="جدیدترین‌ها" href="/blog" description="مقاله، ویدیو و شورتس در یک جریان." />
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </Stagger>
      </section>

      <section>
        <SectionHeader title="شورتس" href="/shorts" description="پخش خودکار فقط در دید." />
        <ShortsRail posts={shorts} />
      </section>

      <section>
        <SectionHeader title="فروشگاه" href="/products" description="محصولات محدود و کاربردی." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <About cms={cms} />
    </div>
  );
}
