import { Suspense } from "react";
import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { Stagger } from "@/components/motion/Reveal";
import { PostCard } from "@/components/content/PostCard";
import { ContentFilters } from "@/components/content/ContentFilters";
import { listCategories, listPublishedPosts, searchPublishedPosts } from "@/lib/data/posts";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/layout/Page";
import { formatNumber, postPath } from "@/lib/utils";
import type { PostType } from "@/lib/types";

export async function ContentGrid({
  title,
  description,
  type,
  categorySlug,
  sort,
  sidebar = false,
  query,
}: {
  title: string;
  description: string;
  type?: PostType;
  categorySlug?: string;
  sort?: "latest" | "popular";
  sidebar?: boolean;
  query?: string;
}) {
  const q = (query ?? "").replace(/[\u0000-\u001F]/g, "").trim().slice(0, 80);
  const searching = q.length >= 2;
  const [posts, categories, popular] = await Promise.all([
    searching
      ? searchPublishedPosts(q, 8).then((hits) =>
          hits
            .filter((hit) => !type || hit.type === type)
            .map((hit) => ({
              id: hit.id,
              type: hit.type,
              title: hit.title,
              slug: hit.slug,
              excerpt: hit.excerpt,
              coverImage: hit.coverImage,
              viewCount: 0,
            })),
        )
      : listPublishedPosts({ type, categorySlug, sort, take: 24 }),
    listCategories(),
    sidebar ? listPublishedPosts({ type, sort: "popular", take: 5 }) : Promise.resolve([]),
  ]);

  const feed = (
    <>
      <Suspense>
        <ContentFilters categories={categories} />
      </Suspense>
      {posts.length ? (
        <Stagger className={`mt-8 grid gap-5 ${type === "BLOG" ? "lg:grid-cols-2" : `sm:grid-cols-2 ${sidebar ? "" : "lg:grid-cols-3"}`}`}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </Stagger>
      ) : (
        <div className="mt-8">
          <EmptyState
            title={searching ? "نتیجه‌ای برای این عبارت نیست" : "محتوایی منتشر نشده"}
            description={searching ? "عبارت دیگری را امتحان کنید." : "به‌زودی مطلب جدید اینجا می‌آید."}
            href="/"
            action="صفحه نخست"
          />
        </div>
      )}
    </>
  );

  return (
    <section>
      <PageHeader title={title} description={searching ? `نتایج جستجو برای «${q}»` : description} />
      {sidebar ? (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div>{feed}</div>
          <aside className="hidden space-y-6 lg:block">
            <div className="surface sticky top-28 p-5">
              <p className="text-sm font-medium">دسته‌ها</p>
              <ul className="mt-3 space-y-1 text-sm">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`${type === "VIDEO" ? "/video" : "/blog"}?category=${c.slug}`}
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
