import type { Metadata } from "next";
import { PostDetail } from "@/components/content/PostDetail";
import { isTestContent } from "@/lib/content-visibility";
import { getPublishedPostBySlug, listPublishedSlugs } from "@/lib/data/posts";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await listPublishedSlugs("VIDEO");
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug, "VIDEO");
  if (!post) return { title: "ویدیو" };
  const metadata = buildMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    image: post.thumbnailUrl || post.coverImage,
    path: `/video/${slug}`,
    type: "video.other",
  });
  return isTestContent(post) ? { ...metadata, robots: { index: false, follow: false } } : metadata;
}

export default async function VideoPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PostDetail slug={slug} type="VIDEO" />;
}
