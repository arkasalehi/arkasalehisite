"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { CoverImage } from "@/components/content/CoverImage";
import { PlayIcon } from "@/components/icons";
import { formatDuration, formatNumber, postPath } from "@/lib/utils";
import type { PostCardPost } from "@/components/content/PostCard";

const VideoPlayer = dynamic(
  () => import("@/components/content/VideoPlayer").then((m) => m.VideoPlayer),
  { ssr: false },
);

export function FeaturedRail({ posts }: { posts: PostCardPost[] }) {
  if (!posts.length) return null;
  const [main, ...rest] = posts;
  const side = rest.slice(0, 3);
  const mainHref = postPath(main.type, main.slug);

  return (
    <div className={side.length ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]" : ""}>
      <article>
        <div className="editorial-media relative aspect-video overflow-hidden rounded-[20px]">
          {main.videoUrl ? (
            <VideoPlayer
              src={main.videoUrl}
              poster={main.thumbnailUrl || main.coverImage}
              className="absolute inset-0 h-full max-h-none rounded-none"
            />
          ) : (
            <Link href={mainHref} className="absolute inset-0">
              <CoverImage
                src={main.coverImage || main.thumbnailUrl}
                alt={main.title}
                seed={main.id}
                kind="video"
                sizes="(max-width: 1024px) 100vw, 70vw"
              />
              <span className="absolute bottom-4 left-4 z-10 grid h-12 w-12 place-items-center rounded-full bg-black/55 text-white">
                <PlayIcon className="h-4 w-4" />
              </span>
            </Link>
          )}
        </div>
        <Link href={mainHref} className="mt-4 block">
          <h3 className="text-2xl font-extrabold tracking-tight md:text-[28px]">{main.title}</h3>
          <p className="mt-1 text-sm text-muted">{formatNumber(main.viewCount)} بازدید</p>
        </Link>
      </article>

      {side.length ? (
        <div className="flex flex-col justify-between gap-4">
          {side.map((post) => (
            <Link key={post.id} href={postPath(post.type, post.slug)} className="flex gap-3">
              <div className="editorial-media relative h-20 w-[120px] shrink-0 overflow-hidden rounded-xl">
                <CoverImage
                  src={post.thumbnailUrl || post.coverImage}
                  alt={post.title}
                  seed={post.id}
                  kind="video"
                  sizes="120px"
                />
              </div>
              <div className="min-w-0 py-0.5">
                <p className="line-clamp-2 text-sm font-semibold leading-6">{post.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatNumber(post.viewCount)} بازدید
                  {post.duration ? ` · ${formatDuration(post.duration)}` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
