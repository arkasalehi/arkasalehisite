"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/providers";
import { Button } from "@/components/ui/Button";
import { formatToman } from "@/lib/utils";

export default function CartPage() {
  const { items, setQty, remove, total } = useCart();

  return (
    <section>
      <h1 className="text-3xl font-medium">سبد خرید</h1>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.productId} className="surface flex items-center gap-4 p-4">
            {item.imageUrl ? (
              <Image src={item.imageUrl} alt={item.title} width={72} height={72} className="rounded-xl object-cover" />
            ) : null}
            <div className="flex-1">
              <Link href={`/product/${item.slug}`} className="font-medium">
                {item.title}
              </Link>
              <p className="text-sm text-accent">{formatToman(item.price)}</p>
            </div>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => setQty(item.productId, Number(e.target.value))}
              className="w-16 rounded-xl border border-white/10 bg-white/5 px-2 py-1"
            />
            <button type="button" className="text-sm text-rose-300" onClick={() => remove(item.productId)}>
              حذف
            </button>
          </div>
        ))}
      </div>
      {items.length ? (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-lg">جمع: {formatToman(total)}</p>
          <Button href="/checkout">ادامه خرید</Button>
        </div>
      ) : (
        <p className="mt-8 text-muted">سبد خالی است.</p>
      )}
    </section>
  );
}
