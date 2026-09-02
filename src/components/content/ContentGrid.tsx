import { Suspense } from "react";
import { Stagger } from "@/components/motion/Reveal";
import { PostCard } from "@/components/content/PostCard";
import { ContentFilters } from "@/components/content/ContentFilters";
import { listCategories, listPublishedPosts } from "@/lib/db/posts";
import type { PostType } from "@prisma/client";

export async function ContentGrid({
  title,
  description,
  type,
  categorySlug,
  sort,
}: {
  title: string;
  description: string;
  type?: PostType;
  categorySlug?: string;
  sort?: "latest" | "popular";
}) {
  const [posts, categories] = await Promise.all([
    listPublishedPosts({ type, categorySlug, sort, take: 24 }),
    listCategories(),
  ]);

  return (
    <section>
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-2xl text-muted">{description}</p>
      <Suspense>
        <ContentFilters categories={categories} />
      </Suspense>
      <Stagger className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </Stagger>
      {!posts.length ? <p className="mt-10 text-muted">محتوایی منتشر نشده.</p> : null}
    </section>
  );
}
