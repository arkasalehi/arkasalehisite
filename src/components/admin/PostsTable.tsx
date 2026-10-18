"use client";

import { useState } from "react";
import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { useRouter } from "next/navigation";
import { typeLabel, formatDate } from "@/lib/utils";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

type Row = {
  id: string;
  title: string;
  slug: string;
  type: "BLOG" | "VIDEO" | "SHORT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  scheduledAt: Date | string | null;
  updatedAt: Date | string;
};

function statusMeta(post: Row): { label: string; tone: "muted" | "success" | "warning" | "danger" } {
  if (post.status === "DRAFT") return { label: "پیش‌نویس", tone: "muted" };
  if (post.scheduledAt && new Date(post.scheduledAt) > new Date()) return { label: "زمان‌بندی", tone: "warning" };
  if (post.status === "PUBLISHED") return { label: "منتشر", tone: "success" };
  return { label: "آرشیو", tone: "danger" };
}

export function PostsTable({ posts }: { posts: Row[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | Row["status"]>("ALL");
  const visible = posts.filter((post) => {
    const hay = `${post.title} ${post.slug}`.toLowerCase();
    if (query.trim() && !hay.includes(query.trim().toLowerCase())) return false;
    if (status !== "ALL" && post.status !== status) return false;
    return true;
  });
  const allIds = visible.map((p) => p.id);
  const allOn = selected.length === visible.length && visible.length > 0;

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

  if (!posts.length) {
    return <EmptyState title="محتوایی نیست" description="اولین مطلب را بسازید." href="/admin/posts/new" action="محتوای جدید" />;
  }

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <label className="min-w-0 flex-1 text-sm">
          <span className="sr-only">جستجو</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی عنوان یا نامک"
            className="field"
          />
        </label>
        <label className="text-sm">
          <span className="sr-only">وضعیت</span>
          <select className="field" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="ALL">همه وضعیت‌ها</option>
            <option value="DRAFT">پیش‌نویس</option>
            <option value="PUBLISHED">منتشر</option>
            <option value="ARCHIVED">آرشیو</option>
          </select>
        </label>
      </div>
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
      <div className="surface overflow-x-auto">
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
            {!visible.length ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted">
                  موردی با این فیلتر نیست.
                </td>
              </tr>
            ) : null}
            {visible.map((post) => {
              const status = statusMeta(post);
              return (
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
                  <td className="p-3 font-medium">{post.title}</td>
                  <td>
                    <Badge>{typeLabel(post.type)}</Badge>
                  </td>
                  <td>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </td>
                  <td className="text-muted">{formatDate(post.updatedAt)}</td>
                  <td className="space-x-3 space-x-reverse p-3">
                    <Link href={`/preview/${post.slug}`} className="text-muted">
                      پیش‌نمایش
                    </Link>
                    <Link href={`/admin/posts/${post.id}`} className="text-accent">
                      ویرایش
                    </Link>
                    <DeleteButton endpoint={`/api/admin/posts?id=${post.id}`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
