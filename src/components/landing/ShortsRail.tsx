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
    <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
      {posts.map((post) => (
        <article key={post.id} className="w-[210px] shrink-0 snap-start">
          {post.videoUrl ? (
            <VideoPlayer
              src={post.videoUrl}
              poster={post.thumbnailUrl || post.coverImage}
              autoPlayInView
              vertical
              className="max-h-[360px]"
            />
          ) : null}
          <Link href={postPath(post.type, post.slug)} className="mt-2 line-clamp-2 block text-sm font-medium">
            {post.title}
          </Link>
        </article>
      ))}
    </div>
  );
}
