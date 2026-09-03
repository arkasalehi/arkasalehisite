import Link from "next/link";
import { listProducts } from "@/lib/data/products";
import { formatToman } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await listProducts();
  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">محصولات</h1>
        <Button href="/admin/products/new">محصول جدید</Button>
      </div>
      <div className="mt-6 space-y-3">
        {products.map((product) => (
          <div key={product.id} className="glass flex items-center justify-between rounded-2xl p-4">
            <div>
              <p className="font-medium">{product.title}</p>
              <p className="text-sm text-cyan-300">{formatToman(product.price)}</p>
            </div>
            <div className="flex gap-3 text-sm">
              <Link href={`/admin/products/${product.id}`} className="text-cyan-300">
                ویرایش
              </Link>
              <DeleteButton endpoint={`/api/admin/products?id=${product.id}`} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
