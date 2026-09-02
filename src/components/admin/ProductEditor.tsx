"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type ProductForm = {
  id?: string;
  title: string;
  slug: string;
  description?: string | null;
  price: number;
  comparePrice?: number | null;
  discountPercent?: number | null;
  stock?: number | null;
  imageUrl?: string | null;
  inStock: boolean;
  sku?: string | null;
  featured: boolean;
};

export function ProductEditor({ initial }: { initial?: ProductForm }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      id: initial?.id,
      title: String(form.get("title")),
      slug: String(form.get("slug")),
      description: String(form.get("description") || "") || null,
      price: Number(form.get("price")),
      comparePrice: form.get("comparePrice") ? Number(form.get("comparePrice")) : null,
      discountPercent: form.get("discountPercent") ? Number(form.get("discountPercent")) : 0,
      stock: form.get("stock") ? Number(form.get("stock")) : 0,
      imageUrl: String(form.get("imageUrl") || "") || null,
      sku: String(form.get("sku") || "") || null,
      inStock: form.get("inStock") === "on",
      featured: form.get("featured") === "on",
    };
    const res = await fetch("/api/admin/products", {
      method: initial?.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "ذخیره نشد");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <input name="title" required defaultValue={initial?.title} placeholder="عنوان" className="field md:col-span-2" />
      <input name="slug" required defaultValue={initial?.slug} placeholder="slug" className="field" />
      <input name="sku" defaultValue={initial?.sku ?? ""} placeholder="SKU" className="field" />
      <input name="price" type="number" required defaultValue={initial?.price} placeholder="قیمت (تومان)" className="field" />
      <input name="comparePrice" type="number" defaultValue={initial?.comparePrice ?? ""} placeholder="قیمت قبلی" className="field" />
      <input name="discountPercent" type="number" min={0} max={90} defaultValue={initial?.discountPercent ?? 0} placeholder="تخفیف ٪" className="field" />
      <input name="stock" type="number" min={0} defaultValue={initial?.stock ?? 0} placeholder="موجودی" className="field" />
      <input name="imageUrl" defaultValue={initial?.imageUrl ?? ""} placeholder="URL تصویر" className="field md:col-span-2" />
      <textarea name="description" defaultValue={initial?.description ?? ""} placeholder="توضیح" className="field min-h-32 md:col-span-2" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="inStock" defaultChecked={initial?.inStock ?? true} /> موجود
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="featured" defaultChecked={initial?.featured} /> ویژه
      </label>
      {error ? <p className="text-sm text-rose-300 md:col-span-2">{error}</p> : null}
      <Button type="submit" className="md:col-span-2">
        ذخیره محصول
      </Button>
    </form>
  );
}
