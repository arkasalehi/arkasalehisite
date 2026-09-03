import Image from "next/image";
import Link from "next/link";
import type { PostType } from "@/lib/types";
import { FadeItem, HoverLift } from "@/components/motion/Reveal";
import { Badge } from "@/components/ui/Badge";
import { HeartIcon, BookmarkIcon, PlayIcon } from "@/components/icons";
import { VideoHoverPreview } from "@/components/content/VideoHoverPreview";
import { formatDate, formatDuration, formatNumber, postPath, typeLabel } from "@/lib/utils";

export type PostCardPost = {
  id: string;
  type: PostType;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  publishedAt?: Date | null;
  readingTime?: number | null;
  duration?: number | null;
  viewCount: number;
  category?: { name: string; slug?: string } | null;
  _count?: { likes: number; comments: number; bookmarks?: number };
};

export function PostCard({ post, featured = false }: { post: PostCardPost; featured?: boolean }) {
  const href = postPath(post.type, post.slug);
  const image = post.coverImage || post.thumbnailUrl;

  return (
    <FadeItem className={featured ? "md:col-span-2" : undefined}>
      <HoverLift>
        <Link href={href} className="glass glow-hover block h-full overflow-hidden rounded-[1.5rem]">
          <div className={`relative bg-foreground/10 ${featured ? "aspect-[16/8]" : "aspect-[16/10]"}`}>
            {post.videoUrl ? (
              <VideoHoverPreview src={post.videoUrl} poster={image} />
            ) : image ? (
              <Image
                src={image}
                alt={post.title}
                fill
                sizes={featured ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
                className="object-cover"
              />
            ) : (
              <div className="h-full bg-gradient-to-br from-[var(--primary)]/25 to-[var(--accent)]/10" />
            )}
            {post.type !== "BLOG" ? (
              <span className="absolute bottom-3 left-3 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur">
                <PlayIcon className="h-4 w-4" />
              </span>
            ) : null}
            <Badge className="absolute right-3 top-3 bg-black/45 text-accent">{typeLabel(post.type)}</Badge>
          </div>
          <div className="p-4">
            {post.category ? <p className="text-xs text-accent">{post.category.name}</p> : null}
            <h3 className={`mt-1 font-medium ${featured ? "text-2xl" : "text-lg"} line-clamp-2`}>{post.title}</h3>
            {post.excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted">{post.excerpt}</p> : null}
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
              <p>
                {post.publishedAt ? formatDate(post.publishedAt) : ""}
                {post.type === "BLOG" && post.readingTime ? ` · ${formatNumber(post.readingTime)} دقیقه مطالعه` : ""}
                {post.type !== "BLOG" && post.duration ? ` · ${formatDuration(post.duration)}` : ""}
              </p>
              {post._count ? (
                <span className="inline-flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <HeartIcon className="h-3.5 w-3.5" />
                    {formatNumber(post._count.likes)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BookmarkIcon className="h-3.5 w-3.5" />
                    {formatNumber(post._count.bookmarks ?? 0)}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
        </Link>
      </HoverLift>
    </FadeItem>
  );
}
