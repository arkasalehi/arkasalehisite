import Link from "next/link";
import { listProducts } from "@/lib/data/products";
import { formatToman } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/Page";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await listProducts();
  return (
    <section>
      <PageHeader title="محصولات" actions={<Button href="/admin/products/new">محصول جدید</Button>} />
      <div className="space-y-3">
        {products.map((product) => (
          <div key={product.id} className="surface flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{product.title}</p>
              <p className="text-sm text-muted">{formatToman(product.price)}</p>
            </div>
            <div className="flex gap-3 text-sm">
              <Link href={`/admin/products/${product.id}`} className="text-muted hover:text-foreground">
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
