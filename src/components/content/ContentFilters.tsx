"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

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
    <div className="mt-6 flex flex-col gap-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <FilterChip active={!category} onClick={() => set("category", "")}>
          همه
        </FilterChip>
        {categories.map((c) => (
          <FilterChip key={c.slug} active={category === c.slug} onClick={() => set("category", c.slug)}>
            {c.name}
          </FilterChip>
        ))}
      </div>
      <div className="flex gap-2">
        <FilterChip active={sort === "latest"} onClick={() => set("sort", "")}>
          جدیدترین
        </FilterChip>
        <FilterChip active={sort === "popular"} onClick={() => set("sort", "popular")}>
          محبوب‌ترین
        </FilterChip>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition duration-200",
        active
          ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-accent"
          : "border-[var(--border)] text-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
