import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getPostBySlugAny } from "@/lib/db/posts";
import { PostDetail } from "@/components/content/PostDetail";

export const dynamic = "force-dynamic";

export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/");
  const { slug } = await params;
  const post = await getPostBySlugAny(slug);
  if (!post) notFound();
  return <PostDetail slug={slug} preview />;
}
