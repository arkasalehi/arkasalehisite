import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { formatDate, postPath } from "@/lib/utils";
import type { PostCardPost } from "@/components/content/PostCard";
import { ArrowIcon } from "@/components/icons";

export function StartHere({ posts }: { posts: PostCardPost[] }) {
  if (!posts.length) return null;
  const features = posts.slice(0, 2);
  const list = posts.slice(2, 8);

  return (
    <div className={`grid gap-5 ${list.length ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]" : ""}`}>
      <div className="grid gap-5 sm:grid-cols-2">
        {features.map((post) => (
          <Link
            key={post.id}
            href={postPath(post.type, post.slug)}
            className="surface glow-hover flex flex-col rounded-[24px] p-6 md:p-7"
          >
            <p className="text-xs text-muted">{post.publishedAt ? formatDate(post.publishedAt) : ""}</p>
            <h3 className="mt-3 text-[18px] font-semibold leading-snug tracking-tight text-foreground md:text-[20px]">
              {post.title}
            </h3>
            {post.excerpt ? <p className="mt-3 line-clamp-4 text-sm leading-7 text-muted">{post.excerpt}</p> : null}
            <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-primary">
              ادامه
              <ArrowIcon className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
      {list.length ? (
        <ul className="rounded-xl border border-border bg-card px-5">
          {list.map((post, index) => (
            <li key={post.id} className={index < list.length - 1 ? "border-b border-border" : ""}>
              <Link href={postPath(post.type, post.slug)} className="flex items-baseline justify-between gap-4 py-4">
                <span className="line-clamp-1 text-[15px] font-medium text-foreground">{post.title}</span>
                <time className="shrink-0 font-mono text-xs text-muted">
                  {post.publishedAt ? formatDate(post.publishedAt) : ""}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
