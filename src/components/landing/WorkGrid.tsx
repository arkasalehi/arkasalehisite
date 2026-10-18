import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { CoverImage } from "@/components/content/CoverImage";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PostCardPost } from "@/components/content/PostCard";
import { postPath } from "@/lib/utils";

function Cards({ posts, kind }: { posts: PostCardPost[]; kind: "blog" | "video" }) {
  if (!posts.length) return null;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => {
        const demo = post.id.startsWith("demo-");
        const href = demo ? (kind === "video" ? "/video" : "/blog") : postPath(post.type, post.slug);
        return (
          <li key={post.id}>
            <Link href={href} className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--brand)_45%,var(--border))]">
              <div className="relative aspect-[16/10] overflow-hidden bg-foreground/5">
                <CoverImage
                  src={post.coverImage || post.thumbnailUrl}
                  alt={post.title}
                  seed={post.id}
                  kind={kind}
                  sizes="(max-width: 768px) 100vw, 360px"
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                {post.category?.name ? <p className="text-[12px] text-muted">{post.category.name}</p> : null}
                <h3 className="mt-1 line-clamp-2 text-[16px] font-semibold leading-7 tracking-tight text-foreground">{post.title}</h3>
                {post.excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted">{post.excerpt}</p> : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function WorkGrid({ blogs, videos }: { blogs: PostCardPost[]; videos: PostCardPost[] }) {
  return (
    <section id="work" className="site-container scroll-mt-20 py-16 md:py-24">
      <div>
        <SectionHeader tone="saas" title="نوشته‌ها" href="/blog" action="همه نوشته‌ها" description="آخرین یادداشت‌های منتشرشده." />
        {blogs.length ? <Cards posts={blogs} kind="blog" /> : <EmptyState compact title="نوشته‌ای نیست" href="/blog" action="وبلاگ" />}
      </div>
      <div className="mt-14">
        <SectionHeader tone="saas" title="ویدیوها" href="/video" action="همه ویدیوها" description="قاب‌های افقی، با برش ثابت ۱۶:۱۰." />
        {videos.length ? <Cards posts={videos} kind="video" /> : <EmptyState compact title="ویدیویی نیست" href="/video" action="ویدیو" />}
      </div>
    </section>
  );
}
