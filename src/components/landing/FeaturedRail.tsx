"use client";

import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import dynamic from "next/dynamic";
import { CoverImage } from "@/components/content/CoverImage";
import { PlayIcon } from "@/components/icons";
import { cn, formatDuration, formatNumber, postPath } from "@/lib/utils";
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
    <div className={side.length ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6" : ""}>
      <article className="overflow-hidden rounded-[24px] border border-[#e8ece6] bg-white/85 p-3 shadow-[0_16px_40px_rgba(20,60,100,0.08)] backdrop-blur-md md:p-4">
        <div className={cn("relative aspect-video overflow-hidden rounded-[18px]", !main.videoUrl && "editorial-media")}>
          {main.videoUrl ? (
            <VideoPlayer
              src={main.videoUrl}
              poster={main.thumbnailUrl || main.coverImage}
              className="absolute inset-0 h-full max-h-none"
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
        <Link href={mainHref} className="mt-4 block px-1 pb-1">
          <h3 className="text-[18px] font-semibold tracking-tight text-[#1e2a24] md:text-[22px]">{main.title}</h3>
          <p className="mt-1 text-sm text-[#8b938d]">{formatNumber(main.viewCount)} بازدید</p>
        </Link>
      </article>

      {side.length ? (
        <div className="flex flex-col justify-between gap-3">
          {side.map((post) => (
            <Link
              key={post.id}
              href={postPath(post.type, post.slug)}
              className="flex gap-3 rounded-[20px] border border-[#e8ece6] bg-white/85 p-2.5 shadow-[0_10px_28px_rgba(20,60,100,0.06)]"
            >
              <div className="editorial-media relative h-20 w-[112px] shrink-0 overflow-hidden rounded-[14px]">
                <CoverImage
                  src={post.thumbnailUrl || post.coverImage}
                  alt={post.title}
                  seed={post.id}
                  kind="video"
                  sizes="120px"
                />
              </div>
              <div className="min-w-0 py-0.5">
                <p className="line-clamp-2 text-sm font-semibold leading-6 text-[#1e2a24]">{post.title}</p>
                <p className="mt-1 text-xs text-[#8b938d]">
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
