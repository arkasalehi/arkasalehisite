"use client";

import Image from "next/image";
import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { useCart } from "@/components/providers";
import { effectivePrice, formatToman, isProductAvailable } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CoverImage } from "@/components/content/CoverImage";
import { ArrowIcon, ToolIcon } from "@/components/icons";

type ProductLite = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
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
  variant = "default",
}: {
  product: ProductLite;
  compact?: boolean;
  variant?: "default" | "tool";
}) {
  const { add } = useCart();
  const sale = effectivePrice(product);
  const available = isProductAvailable(product);
  const showCompare = product.comparePrice && product.comparePrice > sale ? product.comparePrice : product.discountPercent ? product.price : null;

  if (variant === "tool") {
    return (
      <Link href={`/product/${product.slug}`} className="surface glow-hover block rounded-[24px] p-6">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#e8ece6] bg-[#eef2f5] text-[#3390ec]">
          <ToolIcon />
        </span>
        <h3 className="mt-5 text-lg font-semibold tracking-tight text-[#1e2a24]">{product.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-7 text-[#8b938d]">
          {product.description || "ابزار محدود استودیو برای ساخت و انتشار دقیق‌تر."}
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#3390ec]">
          بیشتر
          <ArrowIcon className="h-3.5 w-3.5" />
        </span>
      </Link>
    );
  }

  return (
    <Card className={compact ? "p-4" : undefined}>
      <Link href={`/product/${product.slug}`} className="block">
        <div className={`editorial-media relative overflow-hidden rounded-2xl bg-background ${compact ? "aspect-square" : "aspect-[4/3]"}`}>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          ) : (
            <CoverImage src={null} alt={product.title} seed={product.id} kind="product" sizes="33vw" />
          )}
          {!available ? (
            <span className="absolute left-2 top-2 z-10 rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-[11px]">
              ناموجود
            </span>
          ) : product.discountPercent ? (
            <span className="absolute left-2 top-2 z-10 rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium text-background">
              ٪{product.discountPercent}
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 font-semibold tracking-tight">{product.title}</h3>
      </Link>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="font-medium">{formatToman(sale)}</p>
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
