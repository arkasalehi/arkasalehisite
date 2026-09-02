import type { Metadata } from "next";
import { ProductCard } from "@/components/content/ProductCard";
import { listProducts } from "@/lib/db/products";
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
      <p className="mt-2 text-slate-400">فروش سبک؛ پرداخت در نسخه بعدی به درگاه وصل می‌شود.</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
