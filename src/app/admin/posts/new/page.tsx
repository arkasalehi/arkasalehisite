import { PostEditor } from "@/components/admin/PostEditor";
import { listCategories } from "@/lib/data/posts";
import { listProducts } from "@/lib/data/products";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const [categories, products] = await Promise.all([listCategories(), listProducts()]);
  return (
    <section>
      <h1 className="text-3xl font-semibold">محتوای جدید</h1>
      <div className="mt-6">
        <PostEditor categories={categories} products={products} />
      </div>
    </section>
  );
}
