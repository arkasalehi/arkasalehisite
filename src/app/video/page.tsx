import type { Metadata } from "next";
import { ContentGrid } from "@/components/content/ContentGrid";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: "ویدیو",
  description: "ویدیوهای آموزشی و پشت‌صحنه",
  path: "/video",
});

export default async function VideoIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  return (
    <ContentGrid
      type="VIDEO"
      title="ویدیو"
      description="ویدیوهای افقی با پخش‌کننده سبک HTML5 و بارگذاری تنبل."
      categorySlug={sp.category}
      sort={sp.sort === "popular" ? "popular" : "latest"}
    />
  );
}
