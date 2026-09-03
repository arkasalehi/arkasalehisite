"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { postPath } from "@/lib/utils";
import type { PostCardPost } from "@/components/content/PostCard";

const VideoPlayer = dynamic(
  () => import("@/components/content/VideoPlayer").then((m) => m.VideoPlayer),
  { ssr: false },
);

export function ShortsRail({ posts }: { posts: PostCardPost[] }) {
  if (!posts.length) return null;

  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
      {posts.map((post) => (
        <article key={post.id} className="w-[220px] shrink-0 snap-start">
          <div className="glass overflow-hidden rounded-[1.4rem]">
            {post.videoUrl ? (
              <VideoPlayer
                src={post.videoUrl}
                poster={post.thumbnailUrl || post.coverImage}
                autoPlayInView
                vertical
                className="max-h-[380px] rounded-none"
              />
            ) : (
              <div className="aspect-[9/16] bg-gradient-to-b from-[var(--primary)]/20 to-transparent" />
            )}
          </div>
          <Link href={postPath(post.type, post.slug)} className="mt-2 line-clamp-2 block text-sm font-medium">
            {post.title}
          </Link>
        </article>
      ))}
    </div>
  );
}
