import Link from "next/link";
import { CoverImage } from "@/components/content/CoverImage";
import { formatNumber, postPath } from "@/lib/utils";
import type { PostCardPost } from "@/components/content/PostCard";

export function ShortsRail({ posts }: { posts: PostCardPost[] }) {
  if (!posts.length) return null;

  return (
    <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 pb-2 md:-mx-0 md:px-0">
      {posts.slice(0, 5).map((post) => (
        <Link
          key={post.id}
          href={postPath(post.type, post.slug)}
          className="w-[168px] shrink-0 md:w-[200px]"
        >
          <article className="editorial-media relative aspect-[9/16] overflow-hidden rounded-[20px]">
            <CoverImage
              src={post.thumbnailUrl || post.coverImage}
              alt={post.title}
              seed={post.id}
              kind="short"
              sizes="200px"
            />
            <span className="absolute bottom-3 right-3 z-10 text-xs font-medium text-white">
              {formatNumber(post.viewCount)} بازدید
            </span>
          </article>
          <p className="mt-2 line-clamp-2 text-sm font-medium leading-6">{post.title}</p>
        </Link>
      ))}
    </div>
  );
}
