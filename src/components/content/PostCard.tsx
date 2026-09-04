import Link from "next/link";
import type { PostType } from "@/lib/types";
import { FadeItem, HoverLift } from "@/components/motion/Reveal";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { PlayIcon } from "@/components/icons";
import { CoverImage } from "@/components/content/CoverImage";
import { VideoHoverPreview } from "@/components/content/VideoHoverPreview";
import { formatDate, formatDuration, formatNumber, postPath, typeLabel } from "@/lib/utils";
import { siteConfig } from "@/lib/config";
import type { SampleKind } from "@/lib/media";

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
  author?: { displayName?: string; avatarUrl?: string | null } | null;
  _count?: { likes: number; comments: number; bookmarks?: number };
};

function kindFor(type: PostType): SampleKind {
  if (type === "SHORT") return "short";
  if (type === "VIDEO") return "video";
  return "blog";
}

export function PostCard({ post, featured = false }: { post: PostCardPost; featured?: boolean }) {
  const href = postPath(post.type, post.slug);
  const image = post.coverImage || post.thumbnailUrl;
  const authorName = post.author?.displayName || siteConfig.creator;

  return (
    <FadeItem className={featured ? "md:col-span-2" : undefined}>
      <HoverLift>
        <Link href={href} className="surface glow-hover block h-full overflow-hidden">
          <div className={`editorial-media relative ${featured ? "aspect-[16/8]" : "aspect-[16/10]"}`}>
            {post.videoUrl ? (
              <VideoHoverPreview src={post.videoUrl} poster={image} seed={post.id} kind={kindFor(post.type)} />
            ) : (
              <CoverImage
                src={image}
                alt={post.title}
                seed={post.id}
                kind={kindFor(post.type)}
                sizes={featured ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
              />
            )}
            {post.type !== "BLOG" ? (
              <span className="absolute bottom-3 left-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white">
                <PlayIcon className="h-4 w-4" />
              </span>
            ) : null}
            <Badge className="absolute right-3 top-3 z-10">
              {post.category?.name || typeLabel(post.type)}
            </Badge>
          </div>
          <div className="flex h-[calc(100%-0px)] flex-col p-5 md:p-6">
            <h3 className={`font-extrabold tracking-tight ${featured ? "text-2xl" : "text-lg"} line-clamp-2`}>
              {post.title}
            </h3>
            {post.excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted">{post.excerpt}</p> : null}
            <div className="mt-4 flex items-center justify-between gap-3 pt-1 text-xs text-muted">
              <span className="inline-flex items-center gap-2">
                <Avatar name={authorName} src={post.author?.avatarUrl} size="sm" />
                <span>{authorName}</span>
              </span>
              <span>
                {post.publishedAt ? formatDate(post.publishedAt) : ""}
                {post.type === "BLOG" && post.readingTime ? ` · ${formatNumber(post.readingTime)} دقیقه` : ""}
                {post.type !== "BLOG" && post.duration ? ` · ${formatDuration(post.duration)}` : ""}
              </span>
            </div>
          </div>
        </Link>
      </HoverLift>
    </FadeItem>
  );
}
