"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ContentFilters({
  categories,
}: {
  categories: Array<{ slug: string; name: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "latest";

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <select
        className="field w-auto py-2 text-sm"
        value={category}
        onChange={(e) => set("category", e.target.value)}
      >
        <option value="">همه دسته‌ها</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <select className="field w-auto py-2 text-sm" value={sort} onChange={(e) => set("sort", e.target.value)}>
        <option value="latest">جدیدترین</option>
        <option value="popular">محبوب‌ترین</option>
      </select>
    </div>
  );
}
