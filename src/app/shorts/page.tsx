import type { Metadata } from "next";
import { ShortsFeed } from "@/components/content/ShortsFeed";
import { listPublishedPosts } from "@/lib/data/posts";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: "شورتس",
  description: "ویدیوهای عمودی کوتاه",
  path: "/shorts",
});

export default async function ShortsIndexPage() {
  const shorts = await listPublishedPosts({ type: "SHORT", take: 20 });

  return (
    <section className="-mt-8">
      <h1 className="sr-only">شورتس</h1>
      <ShortsFeed
        posts={shorts.map((post) => ({
          id: post.id,
          slug: post.slug,
          title: post.title,
          type: post.type,
          videoUrl: post.videoUrl,
          thumbnailUrl: post.thumbnailUrl,
          coverImage: post.coverImage,
          _count: post._count,
          liked: false,
          saved: false,
        }))}
      />
    </section>
  );
}
