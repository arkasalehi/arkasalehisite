import { PostEditor } from "@/components/admin/PostEditor";
import { listCategories } from "@/lib/data/posts";

export const dynamic = "force-dynamic";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const categories = await listCategories().catch(() => []);
  const type = sp.type === "VIDEO" ? "VIDEO" : "BLOG";

  return (
    <section>
      <h1 className="text-[28px] font-semibold tracking-tight">{type === "VIDEO" ? "ویدیوی جدید" : "نوشتهٔ جدید"}</h1>
      <div className="mt-6">
        <PostEditor
          categories={categories}
          initial={{ type, status: "DRAFT", title: "", slug: "" }}
        />
      </div>
    </section>
  );
}
