import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Stagger } from "@/components/motion/Reveal";
import { PostCard } from "@/components/content/PostCard";
import { getCategoryBySlug, listPublishedPosts } from "@/lib/data/posts";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 60;

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
      <h1 className="text-3xl font-semibold">{category.name}</h1>
      {category.description ? <p className="mt-2 text-slate-400">{category.description}</p> : null}
      <Stagger className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </Stagger>
    </section>
  );
}
