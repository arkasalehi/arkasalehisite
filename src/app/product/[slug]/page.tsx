import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/content/JsonLd";
import { ProductBuyBox } from "@/components/content/ProductBuyBox";
import { ProductCard } from "@/components/content/ProductCard";
import { getProductBySlug } from "@/lib/data/products";
import { listRelatedProducts } from "@/lib/data/cart";
import { buildMetadata, productJsonLd } from "@/lib/seo";
import { formatToman, effectivePrice, isProductAvailable } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
        <div className="editorial-media relative aspect-square overflow-hidden rounded-[24px] bg-background">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.title} fill className="object-cover grayscale contrast-[1.08]" priority sizes="50vw" />
          ) : (
            <Image src="/samples/tool-1.jpg" alt={product.title} fill className="object-cover grayscale contrast-[1.08]" priority sizes="50vw" />
          )}
          {product.discountPercent > 0 || (product.comparePrice && product.comparePrice > product.price) ? (
            <span className="absolute right-3 top-3 z-10 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
              تخفیف
            </span>
          ) : null}
        </div>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">{product.title}</h1>
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
          <h2 className="text-xl font-medium">محصولات مرتبط</h2>
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
