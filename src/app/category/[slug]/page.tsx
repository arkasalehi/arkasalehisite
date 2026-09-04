import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Stagger } from "@/components/motion/Reveal";
import { PostCard } from "@/components/content/PostCard";
import { getCategoryBySlug, listPublishedPosts } from "@/lib/data/posts";
import { PageHeader } from "@/components/layout/Page";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return buildMetadata({
    title: category?.name ?? "دسته‌بندی",
    description: category?.description,
    path: `/category/${slug}`,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const posts = await listPublishedPosts({ categorySlug: slug });

  return (
    <section>
      <PageHeader title={category.name} description={category.description ?? undefined} />
      <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </Stagger>
    </section>
  );
}
