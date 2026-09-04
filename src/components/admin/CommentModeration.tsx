"use client";

import { useRouter } from "next/navigation";

export function CommentModeration({
  comments,
}: {
  comments: Array<{
    id: string;
    body: string;
    status: string;
    user: { displayName: string };
    post: { title: string };
  }>;
}) {
  const router = useRouter();

  async function patch(id: string, data: Record<string, unknown>) {
    await fetch("/api/admin/comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <article key={comment.id} className="surface p-4">
          <p className="text-sm text-muted">
            {comment.user.displayName} · {comment.post.title} · {comment.status}
          </p>
          <p className="mt-2">{comment.body}</p>
          <div className="mt-3 flex gap-3 text-sm">
            <button type="button" className="text-sm font-medium text-muted hover:text-foreground" onClick={() => patch(comment.id, { status: "VISIBLE" })}>
              نمایش
            </button>
            <button type="button" className="text-amber-300" onClick={() => patch(comment.id, { status: "HIDDEN" })}>
              مخفی
            </button>
            <button type="button" className="text-rose-300" onClick={() => patch(comment.id, { delete: true })}>
              حذف
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
