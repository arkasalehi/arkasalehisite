import type { Metadata } from "next";
import { ProductCard } from "@/components/content/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { listProducts } from "@/lib/data/products";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: "فروشگاه",
  description: "محصولات و آثار آرکا صالحی",
  path: "/products",
});

export default async function ProductsPage() {
  const products = await listProducts();
  return (
    <section>
      <h1 className="text-3xl font-semibold">فروشگاه</h1>
      <p className="mt-2 text-muted">فروش سبک؛ پرداخت در نسخه بعدی به درگاه وصل می‌شود.</p>
      {products.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState title="محصولی موجود نیست" description="وقتی محصولی اضافه شود اینجا دیده می‌شود." href="/" action="صفحه نخست" />
        </div>
      )}
    </section>
  );
}
