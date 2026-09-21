import Link from "next/link";
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
            <p className="text-xs text-[#8b938d]">{post.publishedAt ? formatDate(post.publishedAt) : ""}</p>
            <h3 className="mt-3 text-[18px] font-semibold leading-snug tracking-tight text-[#1e2a24] md:text-[20px]">
              {post.title}
            </h3>
            {post.excerpt ? <p className="mt-3 line-clamp-4 text-sm leading-7 text-[#8b938d]">{post.excerpt}</p> : null}
            <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-[#1b6754]">
              ادامه
              <ArrowIcon className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
      {list.length ? (
        <ul className="rounded-[24px] border border-[#e8ece6] bg-white/80 px-5 shadow-[0_16px_40px_rgba(20,60,100,0.06)] backdrop-blur-md">
          {list.map((post, index) => (
            <li key={post.id} className={index < list.length - 1 ? "border-b border-[#e8ece6]" : ""}>
              <Link href={postPath(post.type, post.slug)} className="flex items-baseline justify-between gap-4 py-4">
                <span className="line-clamp-1 text-[15px] font-medium text-[#1e2a24]">{post.title}</span>
                <time className="shrink-0 text-xs text-[#8b938d]">
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
