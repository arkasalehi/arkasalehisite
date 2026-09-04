"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers";
import { Button } from "@/components/ui/Button";
import { formatToman } from "@/lib/utils";

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function submit() {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "خطا");
      return;
    }
    clear();
    setMessage(data.message);
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  return (
    <section className="mx-auto max-w-xl">
      <h1 className="text-3xl font-medium">تسویه حساب</h1>
      <p className="mt-2 text-muted">درگاه پرداخت هنوز وصل نیست — سفارش به‌صورت پیش‌نویس ثبت می‌شود.</p>
      <p className="mt-6 text-xl text-accent">{formatToman(total)}</p>
      <Button type="button" className="mt-6" disabled={!items.length} onClick={submit}>
        ثبت سفارش آزمایشی
      </Button>
      {message ? <p className="mt-4 text-muted">{message}</p> : null}
    </section>
  );
}
