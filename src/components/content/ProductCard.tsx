"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/providers";
import { effectivePrice, formatToman, isProductAvailable } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type ProductLite = {
  id: string;
  slug: string;
  title: string;
  price: number;
  comparePrice?: number | null;
  discountPercent?: number | null;
  stock?: number | null;
  imageUrl?: string | null;
  inStock: boolean;
};

export function ProductCard({
  product,
  compact = false,
}: {
  product: ProductLite;
  compact?: boolean;
}) {
  const { add } = useCart();
  const sale = effectivePrice(product);
  const available = isProductAvailable(product);
  const showCompare = product.comparePrice && product.comparePrice > sale ? product.comparePrice : product.discountPercent ? product.price : null;

  return (
    <Card className={compact ? "p-4" : "p-5"}>
      <Link href={`/product/${product.slug}`} className="block">
        <div className={`relative overflow-hidden rounded-[var(--radius-md)] bg-foreground/8 ${compact ? "aspect-square" : "aspect-[4/3]"}`}>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-muted">بدون تصویر</div>
          )}
          {!available ? (
            <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">ناموجود</span>
          ) : product.discountPercent ? (
            <span className="absolute left-2 top-2 rounded-full bg-cyan-400 px-2 py-0.5 text-[11px] font-bold text-slate-950">
              ٪{product.discountPercent}
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 font-medium">{product.title}</h3>
      </Link>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-accent">{formatToman(sale)}</p>
          {showCompare ? <p className="text-xs text-muted line-through">{formatToman(showCompare)}</p> : null}
          <p className="text-[11px] text-muted">{available ? `موجود · ${product.stock ?? "—"}` : "ناموجود"}</p>
        </div>
        <Button
          type="button"
          variant="subtle"
          className="px-3 py-1.5 text-xs"
          disabled={!available}
          onClick={() =>
            add({
              productId: product.id,
              slug: product.slug,
              title: product.title,
              price: sale,
              imageUrl: product.imageUrl,
            })
          }
        >
          {available ? "خرید" : "ناموجود"}
        </Button>
      </div>
    </Card>
  );
}
