import { Suspense } from "react";
import Link from "next/link";
import { Stagger } from "@/components/motion/Reveal";
import { PostCard } from "@/components/content/PostCard";
import { ContentFilters } from "@/components/content/ContentFilters";
import { listCategories, listPublishedPosts } from "@/lib/data/posts";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatNumber, postPath } from "@/lib/utils";
import type { PostType } from "@/lib/types";

export async function ContentGrid({
  title,
  description,
  type,
  categorySlug,
  sort,
  sidebar = false,
}: {
  title: string;
  description: string;
  type?: PostType;
  categorySlug?: string;
  sort?: "latest" | "popular";
  sidebar?: boolean;
}) {
  const [posts, categories, popular] = await Promise.all([
    listPublishedPosts({ type, categorySlug, sort, take: 24 }),
    listCategories(),
    sidebar ? listPublishedPosts({ type, sort: "popular", take: 5 }) : Promise.resolve([]),
  ]);

  const feed = (
    <>
      <Suspense>
        <ContentFilters categories={categories} />
      </Suspense>
      {posts.length ? (
        <Stagger className={`mt-8 grid gap-5 sm:grid-cols-2 ${sidebar ? "" : "lg:grid-cols-3"}`}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </Stagger>
      ) : (
        <div className="mt-8">
          <EmptyState title="محتوایی منتشر نشده" description="به‌زودی مطلب جدید اینجا می‌آید." href="/" action="صفحه نخست" />
        </div>
      )}
    </>
  );

  return (
    <section>
      <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl leading-8 text-muted">{description}</p>
      {sidebar ? (
        <div className="mt-2 grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div>{feed}</div>
          <aside className="hidden space-y-6 lg:block">
            <div className="glass sticky top-24 rounded-3xl p-4">
              <p className="text-sm font-medium">دسته‌ها</p>
              <ul className="mt-3 space-y-1 text-sm">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`${type === "VIDEO" ? "/video" : type === "SHORT" ? "/shorts" : "/blog"}?category=${c.slug}`}
                      className="flex items-center justify-between rounded-xl px-2 py-1.5 text-muted hover:bg-foreground/5 hover:text-foreground"
                    >
                      <span>{c.name}</span>
                      <span className="text-xs">{formatNumber(c._count.posts)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm font-medium">محبوب‌ترین‌ها</p>
              <ul className="mt-3 space-y-3">
                {popular.map((post) => (
                  <li key={post.id}>
                    <Link href={postPath(post.type, post.slug)} className="block text-sm leading-7 hover:text-accent">
                      {post.title}
                    </Link>
                    <p className="text-[11px] text-muted">{formatNumber(post.viewCount)} بازدید</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      ) : (
        feed
      )}
    </section>
  );
}
