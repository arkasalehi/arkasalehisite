import type { Metadata } from "next";
import Link from "next/link";
import { VideoPlayer } from "@/components/content/VideoPlayer";
import { listPublishedPosts } from "@/lib/db/posts";
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
    <section>
      <h1 className="text-3xl font-semibold">شورتس</h1>
      <p className="mt-2 text-slate-400">پخش خودکار فقط وقتی ویدیو در دید است.</p>
      <div className="mx-auto mt-8 flex max-w-sm snap-y snap-mandatory flex-col gap-8">
        {shorts.map((post) => (
          <article key={post.id} className="snap-start">
            {post.videoUrl ? (
              <VideoPlayer
                src={post.videoUrl}
                poster={post.thumbnailUrl || post.coverImage}
                autoPlayInView
                vertical
              />
            ) : null}
            <Link href={`/shorts/${post.slug}`} className="mt-3 block text-lg font-medium">
              {post.title}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
