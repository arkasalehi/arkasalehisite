import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/PostEditor";
import { getPostById, listCategories } from "@/lib/data/posts";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, categories] = await Promise.all([getPostById(id), listCategories()]);
  if (!post) notFound();

  return (
    <section>
      <h1 className="text-[28px] font-semibold tracking-tight">ویرایش</h1>
      <div className="mt-6">
        <PostEditor
          categories={categories}
          initial={{
            id: post.id,
            type: post.type,
            status: post.status,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            body: post.body,
            coverImage: post.coverImage,
            videoUrl: post.videoUrl,
            thumbnailUrl: post.thumbnailUrl,
            duration: post.duration,
            categoryId: post.categoryId,
            seoTitle: post.seoTitle,
            seoDescription: post.seoDescription,
            featured: post.featured,
            scheduledAt: post.scheduledAt,
          }}
        />
      </div>
    </section>
  );
}
