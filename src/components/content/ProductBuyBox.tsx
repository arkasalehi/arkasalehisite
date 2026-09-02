"use client";

import { useCart } from "@/components/providers";
import { Button } from "@/components/ui/Button";
import { effectivePrice, formatToman, isProductAvailable } from "@/lib/utils";

export function ProductBuyBox({
  product,
}: {
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    discountPercent?: number | null;
    stock?: number | null;
    imageUrl?: string | null;
    inStock: boolean;
  };
}) {
  const { add } = useCart();
  const sale = effectivePrice(product);
  const available = isProductAvailable(product);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{available ? `${product.stock} عدد موجود` : "در حال حاضر موجود نیست"}</p>
      <Button
        type="button"
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
        {available ? "افزودن به سبد" : "ناموجود"}
      </Button>
      {sale !== product.price ? <p className="text-xs text-muted">قیمت با تخفیف: {formatToman(sale)}</p> : null}
    </div>
  );
}
