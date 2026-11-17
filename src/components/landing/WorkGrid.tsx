import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { ArrowUp, BadgeIcon, WorkGlyph } from "@/components/landing/marks";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PostCardPost } from "@/components/content/PostCard";
import { postPath } from "@/lib/utils";

type Item = { post: PostCardPost; kind: "blog" | "video" };

function hrefFor(post: PostCardPost, kind: "blog" | "video") {
  if (post.id.startsWith("demo-")) return kind === "video" ? "/video" : "/blog";
  return postPath(post.type, post.slug);
}

function Tile({ item, ink }: { item: Item; ink: boolean }) {
  const { post, kind } = item;
  return (
    <Link href={hrefFor(post, kind)} className={ink ? "ph-tile ph-tile-ink" : "ph-tile"}>
      <WorkGlyph kind={kind} />
      <h3>{post.title}</h3>
      <p>{post.excerpt || post.category?.name || (kind === "video" ? "ویدیو" : "نوشته")}</p>
      <span className="ph-tile-go" aria-hidden>
        <ArrowUp />
      </span>
    </Link>
  );
}

export function WorkGrid({ blogs, videos }: { blogs: PostCardPost[]; videos: PostCardPost[] }) {
  const items: Item[] = [];
  const count = Math.max(blogs.length, videos.length);
  for (let i = 0; i < count; i += 1) {
    if (blogs[i]) items.push({ post: blogs[i], kind: "blog" });
    if (videos[i]) items.push({ post: videos[i], kind: "video" });
  }

  return (
    <section id="work" className="ph-section">
      <div className="site-container">
        <div className="ph-explore-head">
          <div>
            <span className="ph-tag">کارها</span>
            <h2 className="ph-display">
              <span className="ph-hero-line">آخرین نوشته‌ها</span>
              <span className="ph-hero-line">
                و <BadgeIcon tone="violet" /> ویدیوها
              </span>
            </h2>
          </div>
          <div className="ph-head-side">
            <p className="ph-caption">آخرین یادداشت‌ها و ویدیوهای منتشرشده.</p>
            <div className="ph-head-links">
              <Link href="/blog" className="ph-btn ph-btn-light">
                همه نوشته‌ها
              </Link>
              <Link href="/video" className="ph-btn ph-btn-light">
                همه ویدیوها
              </Link>
            </div>
          </div>
        </div>
        {items.length ? (
          <div className="ph-tiles">
            {items.map((item, index) => (
              <Tile key={item.post.id} item={item} ink={index === 1} />
            ))}
          </div>
        ) : (
          <EmptyState compact title="هنوز کاری منتشر نشده" href="/blog" action="وبلاگ" />
        )}
      </div>
    </section>
  );
}
