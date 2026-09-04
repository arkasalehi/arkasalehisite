"use client";

import Link from "next/link";
import { VideoPlayer } from "@/components/content/VideoPlayer";
import { LikeButton } from "@/components/content/LikeButton";
import { BookmarkButton } from "@/components/content/BookmarkButton";
import { CoverImage } from "@/components/content/CoverImage";
import { formatNumber } from "@/lib/utils";
import type { PostType } from "@/lib/types";

export type ShortClip = {
  id: string;
  slug: string;
  title: string;
  type: PostType;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  coverImage?: string | null;
  _count: { likes: number; comments: number };
  liked?: boolean;
  saved?: boolean;
};

export function ShortsFeed({ posts }: { posts: ShortClip[] }) {
  if (!posts.length) {
    return <p className="py-20 text-center text-muted">شورتسی منتشر نشده.</p>;
  }

  return (
    <div className="full-bleed mx-auto h-[calc(100dvh-5.5rem)] max-w-md snap-y snap-mandatory overflow-y-auto md:h-[calc(100dvh-4rem)]">
      {posts.map((post) => (
        <article key={post.id} className="relative h-full snap-start overflow-hidden bg-black">
          {post.videoUrl ? (
            <VideoPlayer
              src={post.videoUrl}
              poster={post.thumbnailUrl || post.coverImage}
              autoPlayInView
              vertical
              className="absolute inset-0 h-full max-h-none rounded-none object-cover"
            />
          ) : (
            <div className="editorial-media absolute inset-0">
              <CoverImage src={post.thumbnailUrl || post.coverImage} alt={post.title} seed={post.id} kind="short" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-8 right-4 left-16">
            <Link href={`/shorts/${post.slug}`} className="text-lg font-medium leading-8">
              {post.title}
            </Link>
          </div>
          <div className="absolute bottom-20 left-3 flex flex-col items-center gap-3">
            <LikeButton postId={post.id} initialLiked={Boolean(post.liked)} initialCount={post._count.likes} />
            <BookmarkButton postId={post.id} initialSaved={Boolean(post.saved)} />
            <Link
              href={`/shorts/${post.slug}#comments`}
              className="inline-flex min-w-12 flex-col items-center rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-xs backdrop-blur"
            >
              نظر
              <span>{formatNumber(post._count.comments)}</span>
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
