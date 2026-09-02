import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { getDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getDb().product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <section>
      <h1 className="text-3xl font-semibold">ویرایش محصول</h1>
      <div className="mt-6">
        <ProductEditor initial={product} />
      </div>
    </section>
  );
}
