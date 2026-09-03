"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

type PostFormValues = {
  id?: string;
  type: "BLOG" | "VIDEO" | "SHORT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  title: string;
  slug: string;
  excerpt?: string | null;
  body?: string | null;
  coverImage?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
  categoryId?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  productIds?: string[];
  featured?: boolean;
  scheduledAt?: Date | string | null;
};

function toLocalInput(date?: Date | string | null) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function PostEditor({
  categories,
  products,
  initial,
}: {
  categories: Array<{ id: string; name: string }>;
  products: Array<{ id: string; title: string }>;
  initial?: PostFormValues;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<PostFormValues["type"]>(initial?.type ?? "BLOG");
  const [slug, setSlug] = useState(initial?.slug ?? "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const productIds = form.getAll("productIds").map(String);
    const scheduledRaw = String(form.get("scheduledAt") || "");
    const payload = {
      id: initial?.id,
      type,
      status: String(form.get("status")),
      title: String(form.get("title")),
      slug,
      excerpt: String(form.get("excerpt") || "") || null,
      body: String(form.get("body") || "") || null,
      coverImage: String(form.get("coverImage") || "") || null,
      videoUrl: String(form.get("videoUrl") || "") || null,
      thumbnailUrl: String(form.get("thumbnailUrl") || "") || null,
      duration: form.get("duration") ? Number(form.get("duration")) : null,
      categoryId: String(form.get("categoryId") || "") || null,
      seoTitle: String(form.get("seoTitle") || "") || null,
      seoDescription: String(form.get("seoDescription") || "") || null,
      featured: form.get("featured") === "on",
      scheduledAt: scheduledRaw ? new Date(scheduledRaw).toISOString() : null,
      productIds,
    };

    const res = await fetch("/api/admin/posts", {
      method: initial?.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "ذخیره نشد");
      return;
    }
    router.push("/admin/posts");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <Card className="grid gap-4 md:grid-cols-2">
        <p className="text-sm font-medium md:col-span-2">نوع و انتشار</p>
        <Select value={type} onChange={(e) => setType(e.target.value as PostFormValues["type"])}>
          <option value="BLOG">مقاله</option>
          <option value="VIDEO">ویدیو</option>
          <option value="SHORT">شورتس</option>
        </Select>
        <Select name="status" defaultValue={initial?.status ?? "DRAFT"}>
          <option value="DRAFT">پیش‌نویس</option>
          <option value="PUBLISHED">انتشار / زمان‌بندی</option>
          <option value="ARCHIVED">آرشیو</option>
        </Select>
        <Input
          name="title"
          required
          defaultValue={initial?.title}
          placeholder="عنوان"
          className="md:col-span-2"
          onBlur={(e) => {
            if (!slug) setSlug(slugify(e.target.value));
          }}
        />
        <Input
          name="slug"
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="slug-english"
          className="md:col-span-2"
        />
        <Input name="scheduledAt" type="datetime-local" defaultValue={toLocalInput(initial?.scheduledAt)} className="md:col-span-2" />
        <p className="-mt-2 text-xs text-muted md:col-span-2">برای انتشار زمان‌بندی‌شده، وضعیت را «انتشار» بگذارید و تاریخ آینده انتخاب کنید.</p>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="featured" defaultChecked={initial?.featured} />
          نمایش در برگزیده‌های صفحه نخست
        </label>
      </Card>

      <Card className="grid gap-4">
        <p className="text-sm font-medium">رسانه و متن</p>
        <Input name="coverImage" defaultValue={initial?.coverImage ?? ""} placeholder="URL تصویر جلد" />
        {type !== "BLOG" ? (
          <>
            <Input name="videoUrl" defaultValue={initial?.videoUrl ?? ""} placeholder="URL ویدیو" />
            <div className="grid gap-4 md:grid-cols-2">
              <Input name="thumbnailUrl" defaultValue={initial?.thumbnailUrl ?? ""} placeholder="URL پوستر" />
              <Input name="duration" type="number" defaultValue={initial?.duration ?? ""} placeholder="مدت (ثانیه)" />
            </div>
          </>
        ) : null}
        <Select name="categoryId" defaultValue={initial?.categoryId ?? ""}>
          <option value="">بدون دسته</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Textarea name="excerpt" defaultValue={initial?.excerpt ?? ""} placeholder="خلاصه برای کارت و سئو" />
        <Textarea name="body" defaultValue={initial?.body ?? ""} placeholder="متن اصلی. سرفصل‌ها را با ## و ### بنویسید تا فهرست ساخته شود." className="min-h-56" />
        <p className="-mt-2 text-xs text-muted">برای فهرست مطالب از مارک‌داون ## عنوان و ### زیرعنوان استفاده کنید.</p>
      </Card>

      <Card className="grid gap-4 md:grid-cols-2">
        <p className="text-sm font-medium md:col-span-2">سئو و محصولات</p>
        <Input name="seoTitle" defaultValue={initial?.seoTitle ?? ""} placeholder="عنوان سئو" />
        <Input name="seoDescription" defaultValue={initial?.seoDescription ?? ""} placeholder="توضیح سئو" />
        <fieldset className="md:col-span-2">
          <legend className="mb-2 text-sm text-muted">کارت محصول داخل محتوا</legend>
          {products.map((product) => (
            <label key={product.id} className="ml-4 inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="productIds" value={product.id} defaultChecked={initial?.productIds?.includes(product.id)} />
              {product.title}
            </label>
          ))}
        </fieldset>
      </Card>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={saving}>
          ذخیره
        </Button>
        {slug ? (
          <Button href={`/preview/${slug}`} variant="ghost" type="button">
            پیش‌نمایش
          </Button>
        ) : null}
      </div>
    </form>
  );
}
