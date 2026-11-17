"use client";

import { useRouter } from "next/navigation";
import { SearchGlyph } from "@/components/landing/marks";

export function StudioSearch() {
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const kind = form.get("kind") === "video" ? "video" : "blog";
    const sort = form.get("sort") === "popular" ? "popular" : "";
    const q = String(form.get("q") ?? "")
      .replace(/[\u0000-\u001F]/g, "")
      .trim()
      .slice(0, 80);
    const params = new URLSearchParams();
    if (sort) params.set("sort", sort);
    if (q.length >= 2) params.set("q", q);
    const qs = params.toString();
    router.push(qs ? `/${kind}?${qs}` : `/${kind}`);
  }

  return (
    <form className="ph-search" action="/blog" method="get" onSubmit={onSubmit} role="search">
      <div className="ph-search-head">
        <span className="ph-search-mark" aria-hidden>
          <SearchGlyph />
        </span>
        <div>
          <h2>جستجوی محتوا</h2>
          <p>نوشته‌ها و ویدیوهای منتشرشده در استودیو.</p>
        </div>
      </div>
      <div className="ph-search-row">
        <select className="ph-select" name="kind" aria-label="نوع محتوا" defaultValue="blog">
          <option value="blog">وبلاگ</option>
          <option value="video">ویدیو</option>
        </select>
        <select className="ph-select" name="sort" aria-label="ترتیب" defaultValue="latest">
          <option value="latest">تازه‌ها</option>
          <option value="popular">محبوب‌ترین</option>
        </select>
        <input className="ph-select" name="q" type="search" placeholder="عبارت جستجو" aria-label="عبارت جستجو" maxLength={80} />
        <button className="ph-btn ph-btn-black ph-search-btn" type="submit">
          جستجو
        </button>
      </div>
    </form>
  );
}
