import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import type { PostType } from "@/lib/types";
import { CoverImage } from "@/components/content/CoverImage";
import { PlayIcon } from "@/components/icons";
import { formatDate, postPath, typeLabel } from "@/lib/utils";
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

export function PostCard({
  post,
  featured = false,
  href,
}: {
  post: PostCardPost;
  featured?: boolean;
  href?: string;
}) {
  const to = href ?? postPath(post.type, post.slug);
  const image = post.coverImage || post.thumbnailUrl;

  return (
    <Link
      href={to}
      className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--brand)_45%,var(--border))]"
    >
      <div className={`relative overflow-hidden bg-foreground/5 ${featured ? "aspect-video" : "aspect-[16/10]"}`}>
        <CoverImage
          src={image}
          alt={post.title}
          seed={post.id}
          kind={kindFor(post.type)}
          sizes={featured ? "(max-width: 768px) 100vw, 70vw" : "(max-width: 768px) 100vw, 33vw"}
        />
        {post.type !== "BLOG" ? (
          <span className="absolute bottom-3 start-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white">
            <PlayIcon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[12px] text-muted">{post.category?.name || typeLabel(post.type)}</p>
        <h3 className={`mt-1 line-clamp-2 font-semibold tracking-tight text-foreground ${featured ? "text-xl" : "text-[16px] leading-7"}`}>
          {post.title}
        </h3>
        {post.excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted">{post.excerpt}</p> : null}
        <p className="mt-auto pt-4 text-xs text-muted">{post.publishedAt ? formatDate(post.publishedAt) : ""}</p>
      </div>
    </Link>
  );
}
