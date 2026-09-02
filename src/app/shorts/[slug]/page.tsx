import type { Metadata } from "next";
import { PostDetail } from "@/components/content/PostDetail";
import { hasDatabaseUrl } from "@/lib/db/client";
import { getPublishedPostBySlug, listPublishedSlugs } from "@/lib/db/posts";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateStaticParams() {
  if (!hasDatabaseUrl()) return [];
  try {
    const posts = await listPublishedSlugs("SHORT");
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug, "SHORT");
  if (!post) return { title: "شورتس" };
  return buildMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    image: post.thumbnailUrl || post.coverImage,
    path: `/shorts/${slug}`,
    type: "video.other",
  });
}

export default async function ShortPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PostDetail slug={slug} type="SHORT" />;
}
