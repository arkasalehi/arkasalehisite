import type { Metadata } from "next";
import { ShortsFeed } from "@/components/content/ShortsFeed";
import { getSession } from "@/lib/auth/session";
import { getUserPostState } from "@/lib/data/interactions";
import { listPublishedPosts } from "@/lib/data/posts";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: "شورتس",
  description: "ویدیوهای عمودی کوتاه",
  path: "/shorts",
});

export default async function ShortsIndexPage() {
  const [shorts, session] = await Promise.all([listPublishedPosts({ type: "SHORT", take: 20 }), getSession()]);
  const states = session
    ? await Promise.all(shorts.map((post) => getUserPostState(session.id, post.id).then((s) => [post.id, s] as const)))
    : [];
  const map = Object.fromEntries(states);

  return (
    <section className="-mx-4 -mt-8 md:mx-0">
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
          liked: map[post.id]?.liked,
          saved: map[post.id]?.saved,
        }))}
      />
    </section>
  );
}
