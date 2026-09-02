import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/PostEditor";
import { getPostById, listCategories } from "@/lib/db/posts";
import { listProducts } from "@/lib/db/products";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, categories, products] = await Promise.all([
    getPostById(id),
    listCategories(),
    listProducts(),
  ]);
  if (!post) notFound();

  return (
    <section>
      <h1 className="text-3xl font-semibold">ویرایش محتوا</h1>
      <div className="mt-6">
        <PostEditor
          categories={categories}
          products={products}
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
            productIds: post.products.map((p) => p.productId),
          }}
        />
      </div>
    </section>
  );
}
