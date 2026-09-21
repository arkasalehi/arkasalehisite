import Link from "next/link";
import type { PostType } from "@/lib/types";
import { FadeItem, HoverLift } from "@/components/motion/Reveal";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ArrowIcon, PlayIcon } from "@/components/icons";
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

export function PostCard({
  post,
  featured = false,
  href,
}: {
  post: PostCardPost;
  featured?: boolean;
  href?: string;
}) {
  if (post.type === "BLOG") {
    return (
      <FadeItem className={featured ? "md:col-span-2" : undefined}>
        <BlogInsightCard post={post} href={href} />
      </FadeItem>
    );
  }

  const to = href ?? postPath(post.type, post.slug);
  const image = post.coverImage || post.thumbnailUrl;
  const authorName = post.author?.displayName || siteConfig.creator;

  return (
    <FadeItem className={featured ? "md:col-span-2" : undefined}>
      <HoverLift>
        <Link href={to} className="surface glow-hover block h-full overflow-hidden">
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
            <span className="absolute bottom-3 left-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white">
              <PlayIcon className="h-4 w-4" />
            </span>
            <Badge className="absolute right-3 top-3 z-10">{post.category?.name || typeLabel(post.type)}</Badge>
          </div>
          <div className="flex flex-col p-5 md:p-6">
            <h3 className={`line-clamp-2 font-semibold tracking-tight ${featured ? "text-2xl" : "text-lg"}`}>{post.title}</h3>
            {post.excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted">{post.excerpt}</p> : null}
            <div className="mt-4 flex items-center justify-between gap-3 pt-1 text-xs text-muted">
              <span className="inline-flex items-center gap-2">
                <Avatar name={authorName} src={post.author?.avatarUrl} size="sm" />
                <span>{authorName}</span>
              </span>
              <span>
                {post.publishedAt ? formatDate(post.publishedAt) : ""}
                {post.duration ? ` · ${formatDuration(post.duration)}` : ""}
              </span>
            </div>
          </div>
        </Link>
      </HoverLift>
    </FadeItem>
  );
}

function BlogInsightCard({ post, href: hrefProp }: { post: PostCardPost; href?: string }) {
  const href = hrefProp ?? postPath(post.type, post.slug);
  const image = post.coverImage || post.thumbnailUrl;
  const tags = [post.category?.name, typeLabel(post.type), post.readingTime ? `${formatNumber(post.readingTime)} دقیقه` : null].filter(
    Boolean,
  ) as string[];

  return (
    <HoverLift>
      <Link
        href={href}
        dir="rtl"
        className="relative block h-full overflow-hidden rounded-3xl border border-white/70 bg-white/45 p-4 shadow-[0_16px_40px_rgba(20,60,100,0.08)]"
      >
        <div
          className="card-top relative h-full overflow-hidden rounded-[1.2em] bg-gradient-to-l from-white/80 to-white/40 transition duration-300"
          style={{ backdropFilter: "blur(16px)" }}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-[1.2em] border border-white/70"
            style={{ maskImage: "linear-gradient(225deg, white, transparent 60%)" }}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-[1.2em] border border-[#1b6754]/10"
            style={{ maskImage: "linear-gradient(225deg, transparent 60%, white)" }}
          />

          <div className="relative flex h-full flex-col gap-5 p-5 lg:flex-row lg:items-stretch lg:gap-6 lg:p-6">
            <div className="flex flex-1 flex-col">
              <h3 className="text-lg font-semibold tracking-tight text-[#1e2a24]">{post.title}</h3>
              {post.excerpt ? (
                <p className="mt-3 line-clamp-3 text-sm font-light leading-7 text-[#6b7872]">{post.excerpt}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-[#1b6754]/15 bg-[#1b6754]/8 px-2 py-1 text-[11px] text-[#1b6754]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-medium text-[#5b6b74]">
                ادامه
                <ArrowIcon className="h-4 w-4" />
              </span>
            </div>

            <div className="flex-1 lg:max-w-[280px]">
              <article className="relative flex h-52 flex-col overflow-hidden rounded-2xl border border-[#e8ece6] bg-gradient-to-br from-white to-[#eef4f0] p-3 lg:h-full lg:min-h-[220px]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1e2a24]/50" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#cdd5ce]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#cdd5ce]" />
                  </div>
                  <span className="text-[11px] text-[#8b938d]">Studio</span>
                </div>
                <div className="relative mt-2 mb-2 min-h-[96px] flex-1 overflow-hidden rounded-lg">
                  <CoverImage src={image} alt={post.title} seed={post.id} kind="blog" sizes="(max-width: 1024px) 100vw, 280px" />
                </div>
                <div>
                  <p className="line-clamp-2 text-[13px] font-medium leading-snug tracking-tight text-[#1e2a24]">
                    {post.title}
                  </p>
                  <p className="mt-1 text-[11px] text-[#8b938d]">
                    {post.publishedAt ? formatDate(post.publishedAt) : "یادداشت استودیو"}
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </Link>
    </HoverLift>
  );
}
