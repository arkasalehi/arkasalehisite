import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/content/JsonLd";
import { ProductBuyBox } from "@/components/content/ProductBuyBox";
import { ProductCard } from "@/components/content/ProductCard";
import { hasDatabaseUrl } from "@/lib/db/client";
import { getProductBySlug, listProductSlugs } from "@/lib/db/products";
import { listRelatedProducts } from "@/lib/db/cart";
import { buildMetadata, productJsonLd } from "@/lib/seo";
import { formatToman, effectivePrice, isProductAvailable } from "@/lib/utils";

export const revalidate = 60;

export async function generateStaticParams() {
  if (!hasDatabaseUrl()) return [];
  try {
    const products = await listProductSlugs();
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "محصول" };
  return buildMetadata({
    title: product.title,
    description: product.description,
    image: product.imageUrl,
    path: `/product/${slug}`,
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await listRelatedProducts(slug);

  return (
    <div>
      <article className="grid gap-8 md:grid-cols-2">
        <JsonLd data={productJsonLd(product)} />
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-foreground/8">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.title} fill className="object-cover" priority sizes="50vw" />
          ) : null}
        </div>
        <div>
          <h1 className="text-4xl font-semibold leading-[1.35]">{product.title}</h1>
          <div className="mt-4 flex items-end gap-3">
            <p className="text-2xl text-accent">{formatToman(effectivePrice(product))}</p>
            {product.discountPercent > 0 || (product.comparePrice && product.comparePrice > product.price) ? (
              <p className="text-muted line-through">{formatToman(product.comparePrice || product.price)}</p>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-muted">
            {isProductAvailable(product) ? `موجود — ${product.stock} عدد` : "ناموجود"}
          </p>
          {product.description ? <p className="mt-4 leading-8 text-muted">{product.description}</p> : null}
          <div className="mt-8">
            <ProductBuyBox product={product} />
          </div>
        </div>
      </article>
      {related.length ? (
        <section className="mt-14">
          <h2 className="text-xl font-semibold">محصولات مرتبط</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
