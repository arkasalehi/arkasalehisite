import { notFound, redirect } from "next/navigation";
import { isAdminRole } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";
import { getPostBySlugAny } from "@/lib/data/posts";
import { PostDetail } from "@/components/content/PostDetail";

export const dynamic = "force-dynamic";

export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/");
  const { slug } = await params;
  const post = await getPostBySlugAny(slug);
  if (!post) notFound();
  return <PostDetail slug={slug} preview />;
}
