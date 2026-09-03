import type { Metadata } from "next";
import { ContentGrid } from "@/components/content/ContentGrid";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: "وبلاگ",
  description: "مقالات و یادداشت‌های آرکا صالحی",
  path: "/blog",
});

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  return (
    <ContentGrid
      type="BLOG"
      title="وبلاگ"
      description="یادداشت‌ها و مقالات بلند، بهینه‌شده برای مطالعه و سئو."
      categorySlug={sp.category}
      sort={sp.sort === "popular" ? "popular" : "latest"}
      sidebar
    />
  );
}
