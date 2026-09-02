"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { typeLabel, formatDate, postPath } from "@/lib/utils";
import { DeleteButton } from "@/components/admin/DeleteButton";

type Row = {
  id: string;
  title: string;
  slug: string;
  type: "BLOG" | "VIDEO" | "SHORT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  scheduledAt: Date | string | null;
  updatedAt: Date | string;
};

function statusLabel(post: Row) {
  if (post.status === "DRAFT") return "پیش‌نویس";
  if (post.scheduledAt && new Date(post.scheduledAt) > new Date()) return "زمان‌بندی";
  if (post.status === "PUBLISHED") return "منتشر";
  return "آرشیو";
}

export function PostsTable({ posts }: { posts: Row[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const allIds = posts.map((p) => p.id);
  const allOn = selected.length === posts.length && posts.length > 0;

  async function bulk(action: "delete" | "publish" | "draft") {
    if (!selected.length) return;
    if (action === "delete" && !confirm("حذف گروهی؟")) return;
    await fetch("/api/admin/posts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected, action }),
    });
    setSelected([]);
    router.refresh();
  }

  return (
    <div>
      {selected.length ? (
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          <button type="button" className="rounded-full bg-foreground/8 px-3 py-1" onClick={() => bulk("publish")}>
            انتشار ({selected.length})
          </button>
          <button type="button" className="rounded-full bg-foreground/8 px-3 py-1" onClick={() => bulk("draft")}>
            پیش‌نویس
          </button>
          <button type="button" className="rounded-full bg-rose-500/20 px-3 py-1 text-rose-300" onClick={() => bulk("delete")}>
            حذف
          </button>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="text-muted">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={allOn}
                  onChange={(e) => setSelected(e.target.checked ? allIds : [])}
                />
              </th>
              <th className="p-3">عنوان</th>
              <th>نوع</th>
              <th>وضعیت</th>
              <th>تاریخ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-t border-[var(--border)]">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(post.id)}
                    onChange={(e) =>
                      setSelected((prev) => (e.target.checked ? [...prev, post.id] : prev.filter((id) => id !== post.id)))
                    }
                  />
                </td>
                <td className="p-3">{post.title}</td>
                <td>{typeLabel(post.type)}</td>
                <td>{statusLabel(post)}</td>
                <td>{formatDate(post.updatedAt)}</td>
                <td className="space-x-3 space-x-reverse">
                  <Link href={`/preview/${post.slug}`} className="text-muted">
                    پیش‌نمایش
                  </Link>
                  <Link href={`/admin/posts/${post.id}`} className="text-accent">
                    ویرایش
                  </Link>
                  <DeleteButton endpoint={`/api/admin/posts?id=${post.id}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
