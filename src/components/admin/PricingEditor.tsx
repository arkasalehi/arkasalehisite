"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PricingCms, PricingPackage } from "@/lib/cms/types";

const empty = (): PricingPackage => ({
  id: `pack-${Date.now().toString(36)}`,
  name: "",
  description: "",
  priceAmount: null,
  priceLabel: "توافقی",
  highlighted: false,
  href: "/#contact",
});

export function PricingEditor({ initial }: { initial: PricingCms }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [packages, setPackages] = useState<PricingPackage[]>(initial.packages.slice(0, 3));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  function patch(index: number, next: Partial<PricingPackage>) {
    setPackages((rows) => rows.map((row, i) => (i === index ? { ...row, ...next } : row)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pricing: { title, description, packages } }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "ذخیره نشد");
      return;
    }
    setNotice("قیمت‌ها روی صفحهٔ اول ذخیره شد.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">عنوان بخش</span>
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={80} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">توضیح</span>
        <textarea className="field min-h-20" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
      </label>
      <div className="grid gap-4 lg:grid-cols-3">
        {packages.map((item, index) => (
          <fieldset key={item.id} className="space-y-3 rounded-xl border border-border bg-card p-4">
            <legend className="px-1 text-sm font-medium">بسته {index + 1}</legend>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">نام</span>
              <input className="field" value={item.name} required onChange={(e) => patch(index, { name: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">شناسه</span>
              <input
                className="field"
                value={item.id}
                required
                pattern="[a-z0-9-]+"
                onChange={(e) => patch(index, { id: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">توضیح</span>
              <textarea className="field min-h-20" value={item.description} onChange={(e) => patch(index, { description: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">مبلغ تومان (خالی = توافقی)</span>
              <input
                className="field"
                inputMode="numeric"
                value={item.priceAmount ?? ""}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  patch(index, { priceAmount: raw === "" ? null : Number(raw) });
                }}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">برچسب اگر مبلغ خالی است</span>
              <input className="field" value={item.priceLabel} onChange={(e) => patch(index, { priceLabel: e.target.value })} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.highlighted}
                onChange={(e) => patch(index, { highlighted: e.target.checked })}
              />
              پیشنهاد ویژه
            </label>
            <button type="button" className="text-sm text-rose-600 dark:text-rose-300" onClick={() => setPackages((rows) => rows.filter((_, i) => i !== index))}>
              حذف این بسته
            </button>
          </fieldset>
        ))}
      </div>
      {packages.length < 3 ? (
        <button type="button" className="sb-btn sb-btn-secondary h-9 px-3 text-[13px]" onClick={() => setPackages((rows) => [...rows, empty()])}>
          بسته جدید
        </button>
      ) : null}
      {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
      {notice ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{notice}</p> : null}
      <button type="submit" className="sb-btn sb-btn-primary h-10 px-4" disabled={saving}>
        {saving ? "در حال ذخیره…" : "ذخیره قیمت‌ها"}
      </button>
    </form>
  );
}
